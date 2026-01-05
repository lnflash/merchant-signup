# Issues Resolved

This document details the significant issues that have been identified and resolved in the Flash Merchant Signup application. Each section includes a problem description, solution approach, and implementation details.

## Table of Contents

1. [Account Type Preservation](#1-account-type-preservation)
2. [Coordinate Tracking](#2-coordinate-tracking)
3. [Double-Click Address Selection](#3-double-click-address-selection)
4. [Flash Terminal Checkbox](#4-flash-terminal-checkbox)

## 1. Account Type Preservation

### Issue

The form was failing to save the correct `account_type` when users selected "business" or "merchant" - it was falling back to "personal" in the database.

### Root Cause

A PostgreSQL database trigger was attempting to use the HTTP extension for sending notifications, but this extension wasn't available, causing trigger failures and using defaults for the `account_type` field.

### Solution

1. Modified the API service to ensure explicit account_type setting in all fallback paths:

   ```typescript
   // In src/services/api.ts
   const minimalData = {
     name: data.name,
     phone: data.phone,
     account_type: data.account_type || 'personal', // Preserve original account type
     terms_accepted: true,
     // ...
   };
   ```

2. Replaced HTTP-dependent triggers with alternative logging mechanisms:

   ```sql
   -- Modified database trigger to avoid HTTP dependency
   CREATE OR REPLACE FUNCTION log_signup()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Log to internal table instead of HTTP call
     INSERT INTO signup_logs (signup_id, log_message)
     VALUES (NEW.id, 'New signup recorded: ' || NEW.account_type);

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

3. Enhanced edge functions for redundant account type verification.

## 2. Coordinate Tracking

### Issue

The form wasn't properly saving latitude and longitude coordinates when a user selected an address from Google Maps.

### Root Cause

While coordinates were being extracted from the Google Maps Places API, they weren't being:

1. Properly handled through the form submission flow
2. Correctly converted between string and numeric types
3. Reliably saved in all fallback paths

### Solution

1. Added explicit coordinate extraction in the address selection component:

   ```typescript
   // In app/form/components/EnhancedAddressInput.tsx
   setValue('business_address', place.formatted_address, { shouldValidate: true });
   setValue('latitude', place.geometry.location?.lat() || 0, { shouldValidate: true });
   setValue('longitude', place.geometry.location?.lng() || 0, { shouldValidate: true });
   ```

2. Enhanced the API service to preserve coordinates in all fallback paths:

   ```typescript
   // In src/services/api.ts
   ...(data.latitude !== undefined && data.latitude !== null &&
       (typeof data.latitude !== 'string' || data.latitude !== '')
     ? {
         latitude: typeof data.latitude === 'string'
           ? parseFloat(data.latitude)
           : data.latitude,
       }
     : {}),
   ```

3. Added comprehensive debug logging for coordinate tracking:

   ```typescript
   console.log('📍 SUPABASE DIRECT SUBMISSION COORDINATES:', {
     latitude: data.latitude,
     longitude: data.longitude,
     latitudeType: typeof data.latitude,
     longitudeType: typeof data.longitude,
   });
   ```

4. Fixed TypeScript errors related to null reference handling.

## 3. Double-Click Address Selection

### Issue

Users needed to select an address twice from the dropdown to get coordinates - the first selection wasn't properly capturing or saving the location data.

### Root Cause

Race conditions in the address selection process meant that when an address was selected from the dropdown:

1. The form state was updated with the address text
2. But the coordinates weren't being captured because the Places API callback hadn't yet executed
3. Focus/blur event handling was interrupted before coordinate extraction

### Solution

1. Fixed race conditions by forcing blur events to complete the selection:

   ```typescript
   // In app/form/components/EnhancedAddressInput.tsx
   // Force blur to ensure selection is complete
   if (document.activeElement === inputRef.current && inputRef.current) {
     inputRef.current.blur();
   }
   ```

2. Improved state management to prevent react re-renders from clearing coordinates:

   ```typescript
   // Added local state to temporarily store coordinates
   const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

   // Use useEffect to apply coordinates to form after render
   useEffect(() => {
     if (coordinates) {
       setValue('latitude', coordinates.lat, { shouldValidate: false });
       setValue('longitude', coordinates.lng, { shouldValidate: false });
     }
   }, [coordinates, setValue]);
   ```

3. Added comprehensive debugging to track coordinate flow.

## 4. Flash Terminal Checkbox

### Issue

The "Do you want a Flash Terminal?" checkbox wasn't correctly saving TRUE to the database when checked by the user.

### Root Cause

Multiple issues were identified:

1. **Column Name Mismatch:** The code was using `terminal_requested` but the database had a column named `wants_terminal`
2. **Value Type Issues:** The checkbox value wasn't properly converted to a boolean type
3. **Form State Management:** React Hook Form registration was causing issues with the checkbox state

### Solution

1. Fixed column name references throughout the codebase:

   ```typescript
   // In src/services/api.ts - Changed from terminal_requested to wants_terminal
   ...(data.wants_terminal !== undefined ? { wants_terminal: !!data.wants_terminal } : {}),
   ```

2. Enhanced checkbox state management by removing React Hook Form registration:

   ```typescript
   // In app/form/components/BusinessInfoStep.tsx
   <input
     id="wants_terminal"
     type="checkbox"
     // IMPORTANT: Don't use register here - it can cause issues with the checkbox state
     // Instead, manage the state manually
     checked={!!watch('wants_terminal')}
     className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
     onChange={e => {
       // Explicitly set the boolean value based on checkbox state
       const isChecked = e.target.checked;
       // CRITICAL: Force true or false boolean value
       setValue('wants_terminal', isChecked ? true : false, { shouldValidate: false });
       // Log the change to help debug
       console.log('💻 Terminal checkbox changed:', {
         isChecked,
         forcedBoolean: isChecked ? true : false,
         type: typeof (isChecked ? true : false),
       });
     }}
   />
   ```

3. Added explicit boolean conversion at multiple points in the form submission flow:

   ```typescript
   // In app/form/components/SignupForm.tsx - onSubmit method
   // CRITICAL: Force the terminal value to be a proper boolean before submission
   if (data.wants_terminal !== undefined) {
     data.wants_terminal = data.wants_terminal ? true : false;
     console.log('💻 TERMINAL VALUE FORCED TO BOOLEAN:', {
       wantsTerminal: data.wants_terminal,
       type: typeof data.wants_terminal,
     });
   }
   ```

4. Added a debug display for the checkbox state in development mode:

   ```typescript
   // In app/form/components/BusinessInfoStep.tsx
   {process.env.NODE_ENV === 'development' && (
     <div className="mt-1 text-xs text-gray-400">
       Terminal state: {watch('wants_terminal') ? 'true' : 'false'}(
       {typeof watch('wants_terminal')})
     </div>
   )}
   ```

5. Set proper default value in the form initialization:
   ```typescript
   // In app/form/components/SignupForm.tsx
   const methods = useForm<SignupFormData>({
     resolver: zodResolver(signupFormSchema),
     defaultValues: {
       account_type: 'personal',
       terms_accepted: false as unknown as true,
       wants_terminal: false, // Initialize the terminal checkbox to unchecked explicitly
     },
   });
   ```

These fixes ensure that when users check the "Do you want a Flash Terminal?" checkbox, the value is properly converted to a boolean and correctly saved to the `wants_terminal` field in the database.
