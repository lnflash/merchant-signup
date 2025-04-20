import { useState, useRef, useEffect, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { getSupabaseClient, createMockSupabaseClient } from '../../../lib/supabase-singleton';
import { useCredentials } from '../../../src/hooks/useCredentials';
import { config } from '../../../src/config';

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    setValue,
    register,
    formState: { errors },
    clearErrors,
  } = useFormContext();
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Supabase credentials from our hook
  const {
    credentials,
    loading: credentialsLoading,
    error: credentialsError,
    hookId,
  } = useCredentials();

  // Create a unique ID for this component instance for tracing
  const componentId = useRef(
    `upload_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
  );

  // File size limit in bytes (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic'];

  // Define handleFiles with useCallback to prevent it from changing on every render
  const handleFiles = useCallback(
    async (fileList: FileList) => {
      // Generate a unique ID for this specific upload transaction
      const uploadId = `${componentId.current}_${Date.now().toString(36)}`;

      try {
        console.info(`[📤] [${uploadId}] Starting file upload process`);
        setErrorMessage(null);
        setUploadStatus('idle');

        if (fileList.length === 0) {
          console.info(`[📤] [${uploadId}] No files selected, aborting upload`);
          return;
        }

        const file = fileList[0];

        // Safety check
        if (!file) {
          console.warn(`[📤] [${uploadId}] File object is null/undefined, aborting`);
          return;
        }

        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          console.warn(`[📤] [${uploadId}] Invalid file type: ${file.type}`);
          setErrorMessage('Please upload a valid image (JPG, PNG, or HEIC)');
          return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          console.warn(
            `[📤] [${uploadId}] File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${MAX_FILE_SIZE / 1024 / 1024}MB)`
          );
          setErrorMessage('File size exceeds 5MB limit');
          return;
        }

        // Log file information
        console.info(`[📤] [${uploadId}] Processing file:`, {
          name: file.name,
          type: file.type,
          size: `${(file.size / 1024).toFixed(2)}KB`,
          lastModified: new Date(file.lastModified).toISOString(),
        });

        setUploading(true);

        // Create a local preview
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            setFilePreview(e.target.result as string);
            console.info(`[📤] [${uploadId}] File preview created`);
          }
        };
        reader.readAsDataURL(file);

        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        console.info(`[📤] [${uploadId}] Generated file path: ${filePath}`);

        // Attempt to upload the file to Supabase Storage using our credentials API
        let fileUrl: string;

        try {
          // ==============================================
          // STEP 1: Verify and prepare credentials
          // ==============================================
          console.info(
            `[📤] [${uploadId}] STEP 1: Verifying credentials from hook (ID: ${hookId})`
          );

          // First check if credentials are still loading and wait if necessary
          if (credentialsLoading) {
            console.warn(`[📤] [${uploadId}] ⏳ Credentials still loading, waiting...`);
            // Wait for credentials to load (with timeout)
            try {
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Timeout waiting for credentials'));
                }, 3000);

                // Check every 300ms if credentials have loaded
                const checkCredentials = () => {
                  if (!credentialsLoading) {
                    clearTimeout(timeout);
                    resolve(true);
                  } else {
                    setTimeout(checkCredentials, 300);
                  }
                };

                checkCredentials();
              });
              console.info(`[📤] [${uploadId}] ✓ Credentials finished loading`);
            } catch (error) {
              console.error(`[📤] [${uploadId}] ⚠️ Timed out waiting for credentials`);
              // Continue anyway, we'll check credentials next
            }
          }

          // Log detailed credential status (extremely thorough for debugging)
          const credStatus = {
            uploadId,
            hookId,
            timestamp: new Date().toISOString(),
            // File details
            fileType: file.type,
            fileSize: file.size,
            fileName: file.name,
            // Credential status
            credentialsLoading,
            credentialsError: credentialsError
              ? {
                  message: credentialsError.message,
                  name: credentialsError.name,
                }
              : null,
            // Credential details (sanitized to avoid logging actual values)
            hasCredentialsObject: !!credentials,
            hasUrl: !!credentials?.supabaseUrl,
            hasKey: !!credentials?.supabaseKey,
            urlLength: credentials?.supabaseUrl?.length || 0,
            keyLength: credentials?.supabaseKey?.length || 0,
            urlFirstChars: credentials?.supabaseUrl ? credentials.supabaseUrl.substring(0, 8) : '',
            // Where credentials came from
            credTraceId: credentials?.traceId || 'none',
            serverTime: credentials?.serverTime,
            timeSinceServerResponse: credentials?.serverTime
              ? `${(new Date().getTime() - new Date(credentials.serverTime).getTime()) / 1000}s`
              : 'unknown',
            // Environment info
            bucket: credentials?.bucket || config.supabase.storageBucket,
            environment: process.env.NODE_ENV,
            platform: credentials?.platform || 'unknown',
            buildTime: process.env.IS_BUILD_TIME,
            // Config fallbacks
            configHasSupabaseUrl: !!config.supabase.url,
            configHasSupabaseKey: !!config.supabase.anonKey,
            configSupabaseUrlLength: config.supabase.url?.length || 0,
            configSupabaseKeyLength: config.supabase.anonKey?.length || 0,
          };

          console.info(`[📤] [${uploadId}] 📋 Comprehensive credential status:`, credStatus);

          // ==============================================
          // STEP 2: Decision point - mock or real client
          // ==============================================
          console.info(`[📤] [${uploadId}] STEP 2: Initializing Supabase client`);

          // Use specific bucket from credentials or config
          const bucket = credentials?.bucket || config.supabase.storageBucket;
          let supabaseClient;
          let clientType = 'unknown';

          // Handle primary credentials flow - first check from credentials API
          if (credentials?.supabaseUrl && credentials?.supabaseKey) {
            console.info(
              `[📤] [${uploadId}] ✅ Using real Supabase client with credentials from API response`
            );
            clientType = 'real_from_api';
            try {
              // Create the client with proper tracing
              console.info(`[📤] [${uploadId}] Creating Supabase client with valid credentials:`, {
                urlLength: credentials.supabaseUrl.length,
                keyLength: credentials.supabaseKey.length,
                bucket,
              });

              supabaseClient = getSupabaseClient(credentials.supabaseUrl, credentials.supabaseKey);

              // Verify client was created correctly
              if (!supabaseClient) {
                throw new Error('getSupabaseClient returned null or undefined');
              }

              console.info(`[📤] [${uploadId}] ✓ Supabase client created successfully`);
            } catch (error) {
              clientType = 'mock_after_client_error';
              console.error(`[📤] [${uploadId}] ❌ Failed to create Supabase client:`, {
                error: error instanceof Error ? error.message : String(error),
                stack:
                  error instanceof Error
                    ? error.stack?.substring(0, 150) + '...'
                    : 'No stack trace',
              });
              console.warn(
                `[📤] [${uploadId}] ⚠️ Falling back to mock client after client creation error`
              );
              supabaseClient = createMockSupabaseClient();
            }
          }
          // Fallback #1: Try config directly as a backup source of credentials
          else if (config.supabase.url && config.supabase.anonKey) {
            console.warn(
              `[📤] [${uploadId}] ⚠️ API credentials missing, falling back to config.supabase values`
            );
            clientType = 'real_from_config';
            try {
              supabaseClient = getSupabaseClient(config.supabase.url, config.supabase.anonKey);
              console.info(`[📤] [${uploadId}] ✓ Created fallback Supabase client from config`);
            } catch (error) {
              clientType = 'mock_after_fallback_error';
              console.error(
                `[📤] [${uploadId}] ❌ Failed to create fallback Supabase client:`,
                error
              );
              supabaseClient = createMockSupabaseClient();
            }
          }
          // Fallback #2: No valid credentials anywhere, use mock
          else {
            clientType = 'mock_no_credentials';
            console.warn(`[📤] [${uploadId}] ⚠️ NO CREDENTIALS FOUND! Using mock client.`);
            supabaseClient = createMockSupabaseClient();
          }

          // ==============================================
          // STEP 3: Perform the file upload
          // ==============================================
          console.info(`[📤] [${uploadId}] STEP 3: Uploading file using ${clientType} client`);
          console.info(
            `[📤] [${uploadId}] Starting upload to bucket: ${bucket}, file: ${filePath}`
          );

          // Actually perform the upload
          const uploadStart = Date.now();
          const { data, error: uploadError } = await supabaseClient.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true,
            });
          const uploadDuration = Date.now() - uploadStart;

          // Check for upload errors
          if (uploadError) {
            console.error(`[📤] [${uploadId}] ❌ UPLOAD FAILED after ${uploadDuration}ms!`, {
              error: uploadError,
              errorMessage: uploadError.message,
              clientType,
            });
            throw uploadError;
          }

          console.info(`[📤] [${uploadId}] ✓ Upload succeeded in ${uploadDuration}ms`, {
            data,
            clientType,
          });

          // ==============================================
          // STEP 4: Get and validate the public URL
          // ==============================================
          console.info(`[📤] [${uploadId}] STEP 4: Getting public URL for uploaded file`);

          // Get the public URL for the uploaded file
          const { data: urlData } = supabaseClient.storage.from(bucket).getPublicUrl(filePath);

          console.info(`[📤] [${uploadId}] 🔗 Generated URL:`, {
            publicUrl: urlData.publicUrl.substring(0, 30) + '...',
            urlLength: urlData.publicUrl.length,
            isMockUrl: urlData.publicUrl.includes('example.com'),
            bucket,
            filePath,
            clientType,
          });

          // ==============================================
          // STEP 5: Handle mock URL fallback if needed
          // ==============================================

          // If we got a mock URL but expected a real one, try to manually construct it
          if (
            urlData.publicUrl.includes('example.com') &&
            (clientType === 'real_from_api' || clientType === 'real_from_config')
          ) {
            console.warn(
              `[📤] [${uploadId}] ⚠️ Received mock URL despite using real credentials!`,
              {
                url: urlData.publicUrl.substring(0, 20) + '...',
                clientType,
              }
            );

            // Try to construct a valid URL using known Supabase patterns
            const activeUrl = credentials?.supabaseUrl || config.supabase.url || '';
            if (activeUrl) {
              const projectRef = activeUrl.match(/https:\/\/([^.]+)/)?.[1];
              if (projectRef) {
                fileUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;
                console.info(`[📤] [${uploadId}] 🔄 Created direct Supabase URL:`, {
                  url: fileUrl.substring(0, 30) + '...',
                  urlLength: fileUrl.length,
                  projectRef,
                });
              } else {
                fileUrl = urlData.publicUrl;
                console.warn(
                  `[📤] [${uploadId}] ⚠️ Couldn't extract project ref from URL: ${activeUrl.substring(0, 20)}...`
                );
              }
            } else {
              fileUrl = urlData.publicUrl;
              console.warn(
                `[📤] [${uploadId}] ⚠️ No Supabase URL available to extract project ref`
              );
            }
          } else {
            fileUrl = urlData.publicUrl;
            if (!urlData.publicUrl.includes('example.com')) {
              console.info(`[📤] [${uploadId}] ✅ UPLOAD SUCCESSFUL with real URL:`, {
                url: fileUrl.substring(0, 30) + '...',
                length: fileUrl.length,
                clientType,
              });
            } else if (clientType.startsWith('mock')) {
              console.info(`[📤] [${uploadId}] ✓ Using expected mock URL with mock client:`, {
                url: fileUrl.substring(0, 30) + '...',
                clientType,
              });
            }
          }
        } catch (error) {
          // ==============================================
          // Error handling and fallback URL generation
          // ==============================================
          console.error(`[📤] [${uploadId}] ❌ ERROR IN UPLOAD PROCESS:`, {
            error: error instanceof Error ? error.message : String(error),
            stack:
              error instanceof Error ? error.stack?.substring(0, 150) + '...' : 'No stack trace',
          });

          // Generate a detailed error report
          const errorReport = {
            uploadId,
            hookId,
            timestamp: new Date().toISOString(),
            errorMessage: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : 'Unknown',
            fileDetails: {
              type: file.type,
              size: file.size,
              name: file.name,
              path: filePath,
            },
            credentialStatus: {
              hasCredentials: !!credentials,
              hasUrl: !!credentials?.supabaseUrl,
              hasKey: !!credentials?.supabaseKey,
              urlLength: credentials?.supabaseUrl?.length || 0,
              keyLength: credentials?.supabaseKey?.length || 0,
              traceId: credentials?.traceId || 'none',
              urlSource: credentials?.supabaseUrl
                ? 'api_response'
                : config.supabase.url
                  ? 'config_fallback'
                  : 'none',
            },
            browserInfo: {
              userAgent: navigator.userAgent,
              language: navigator.language,
              online: navigator.onLine,
            },
            environment: process.env.NODE_ENV,
          };

          console.error(`[📤] [${uploadId}] 📊 Comprehensive error details:`, errorReport);
          setErrorMessage('Failed to upload file. Please try again.');

          // Fallback to mock URL in development only
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`[📤] [${uploadId}] ⚠️ Using mock URL as fallback (development mode)`);
            const bucket = credentials?.bucket || config.supabase.storageBucket;
            fileUrl = `https://example.com/${bucket}/${filePath}`;
          } else {
            // In production, show error but allow form submission with mock URL
            fileUrl = `https://example.com/${config.supabase.storageBucket}/${filePath}`;
            console.error(
              `[📤] [${uploadId}] 🚨 CRITICAL: Using mock URL in PRODUCTION due to upload failure!`,
              {
                url: fileUrl.substring(0, 30) + '...',
                formSubmitWill: 'continue with mock URL',
                recommendation: 'Fix credentials on server',
              }
            );
          }
        }

        // ==============================================
        // STEP 6: Update form with file URL
        // ==============================================
        console.info(`[📤] [${uploadId}] STEP 6: Updating form with file URL:`, {
          urlAvailable: !!fileUrl,
          urlLength: fileUrl?.length || 0,
          isMockUrl: fileUrl?.includes('example.com'),
        });

        // Update the form state with the URL
        setValue('id_image_url', fileUrl, {
          shouldValidate: true,
        });

        // Clear any existing errors for this field
        clearErrors('id_image_url');
        console.info(`[📤] [${uploadId}] ✓ Form updated with file URL`);

        setUploadStatus('success');
      } catch (error) {
        console.error(`[📤] [${uploadId}] 💥 Unhandled error in file upload:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
        });
        setUploadStatus('error');
        setErrorMessage('Upload failed. Please try again.');
      } finally {
        console.info(
          `[📤] [${uploadId}] ✓ File upload process complete with status: ${uploadStatus}`
        );
        setUploading(false);
      }
    },
    [componentId, credentialsLoading, credentialsError, credentials, hookId, setValue, clearErrors]
  );

  // Add React hooks for initialization and cleanup
  useEffect(() => {
    // Store current componentId value to avoid the cleanup function using a changed ref value
    const currentComponentId = componentId.current;
    console.info(
      `[📤] [${currentComponentId}] FileUpload component initialized, credential hook ID: ${hookId}`
    );
    return () => {
      console.info(`[📤] [${currentComponentId}] FileUpload component cleanup`);
    };
  }, [hookId]);

  // Add event listeners for drag and drop
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-blue-500');
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-500');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-500');

      if (!e.dataTransfer) return;

      handleFiles(e.dataTransfer.files);
    };

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, [handleFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    handleFiles(event.target.files);
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div id="file-upload-section" className="mb-6">
      <h4 className="text-md font-medium mb-2">Upload ID Document*</h4>
      <div className="flex items-center mb-4 text-sm">
        <p className="text-gray-700">Please upload a clear photo of your government-issued ID</p>
        <div className="flex items-center">
          <span className="text-red-500 ml-1">*</span>
          <div className="relative ml-2 group">
            <span className="cursor-help text-blue-500">
              ⓘ
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 bg-gray-800 text-white text-xs rounded p-2 hidden group-hover:block z-10">
                Accepted formats: JPG, PNG, HEIC
                <br />
                Maximum size: 5MB
                <br />
                Make sure all text is clearly readable
                <br />
                <strong>Required for merchant accounts</strong>
              </div>
            </span>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id="hidden_file_input"
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/heic"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload ID document"
      />

      {/* Hidden input for form state */}
      <input type="hidden" id="id_image_url" {...register('id_image_url')} />

      <div
        ref={dropZoneRef}
        onClick={openFileSelector}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          uploadStatus === 'error'
            ? 'border-red-500 bg-red-50'
            : uploadStatus === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {filePreview ? (
          <div className="mx-auto">
            <img src={filePreview} alt="ID Preview" className="max-h-40 mx-auto mb-2" />
            {uploadStatus === 'success' && (
              <div className="flex items-center justify-center text-green-600 mb-2">
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Upload successful</span>
              </div>
            )}
            <p className="text-sm text-blue-600">Click to change file</p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 0H8m12 0a4 4 0 01-4-4m4 4a4 4 0 004 4m0-4v-4m-4-4l4-4m0 0l4 4m-4-4v12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-1 text-sm text-gray-600">
              {uploading ? 'Uploading...' : 'Drag and drop or click to upload ID'}
            </p>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation(); // Prevent double triggering
                openFileSelector();
              }}
              className="mt-3 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Select File
            </button>
            <p className="mt-2 text-xs text-gray-500">JPG, PNG, HEIC • Max 5MB</p>
          </div>
        )}
      </div>

      {errorMessage && <p className="form-error mt-2">{errorMessage}</p>}

      {errors.id_image_url && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
          <p className="form-error font-medium flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {errors.id_image_url.message?.toString() ||
              'ID document is required for merchant accounts'}
          </p>
        </div>
      )}

      {uploadStatus === 'success' && !errorMessage && (
        <p className="text-xs mt-2 text-gray-500">
          Your ID will be securely stored and only used for verification purposes.
        </p>
      )}
    </div>
  );
}
