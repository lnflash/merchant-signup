# Flash Terminal Checkbox Feature

This document provides comprehensive documentation for the Flash Terminal checkbox functionality in the merchant signup form.

## Overview

The Flash Terminal checkbox allows merchants to indicate whether they would like to receive a physical Flash Terminal device for their business. When checked, this information is stored in the database and used by the Flash team for follow-up.

## Technical Implementation

### Database Schema

The checkbox value is stored in the `wants_terminal` column in the `signups` table:

```sql
-- In db/alter-table.sql
ALTER TABLE signups
ADD COLUMN IF NOT EXISTS wants_terminal BOOLEAN DEFAULT false;

-- Add description
COMMENT ON COLUMN signups.wants_terminal IS 'Indicates whether the merchant wants a Flash Terminal device';
```

### Component Implementation

The checkbox is implemented in the BusinessInfoStep component:

```tsx
// In app/form/components/BusinessInfoStep.tsx
<div className="form-group mb-4 mt-6">
  <div className="flex items-start">
    <div className="flex items-center h-5">
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
    </div>
    <div className="ml-3 text-sm">
      <label htmlFor="wants_terminal" className="font-medium text-gray-700 flex items-center">
        Do you want a Flash Terminal?
        <div className="relative ml-2 group">
          <svg
            className="w-4 h-4 text-gray-500 cursor-pointer"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div
            className="absolute left-0 bottom-6 w-64 p-3 text-xs bg-gray-700 text-white rounded shadow-lg
               opacity-0 pointer-events-none group-hover:opacity-100 transition duration-150 ease-in-out z-50"
          >
            A Flash Terminal is a smartdevice that can accept payment via Flash for your business
            and print receipts. A customer service representative will contact you if you check this
            box.
          </div>
        </div>
      </label>
    </div>
  </div>

  {/* Debug display for terminal value - only visible in development */}
  {process.env.NODE_ENV === 'development' && (
    <div className="mt-1 text-xs text-gray-400">
      Terminal state: {watch('wants_terminal') ? 'true' : 'false'}({typeof watch('wants_terminal')})
    </div>
  )}
</div>
```

### Form Initialization

The checkbox is initialized with a default value in the form setup:

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

### Form Submission

When the form is submitted, the terminal checkbox value is explicitly converted to a boolean to ensure correct type:

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

### API Service

In the API service, the checkbox value is properly handled for all submission paths:

```typescript
// In src/services/api.ts
// CRITICAL: Must use wants_terminal (not terminal_requested) to match DB schema
...(data.wants_terminal !== undefined ? { wants_terminal: !!data.wants_terminal } : {}),
```

## State Management Approach

The terminal checkbox uses a special state management approach:

1. **Manual State Management**: We don't use React Hook Form's `register` function for the checkbox to avoid state management issues.

2. **Double Conversion**: We apply a double boolean conversion (`!!` operator) to ensure proper boolean type:

   ```typescript
   setValue('wants_terminal', isChecked ? true : false, { shouldValidate: false });
   ```

3. **Explicit Validation Disabling**: We use `{ shouldValidate: false }` to prevent unnecessary validation when the checkbox state changes.

## Debugging Features

To aid in debugging, the component includes:

1. **Console Logging**: Detailed logs trace the checkbox value through the form lifecycle:

   ```typescript
   console.log('💻 Terminal checkbox changed:', {
     isChecked,
     forcedBoolean: isChecked ? true : false,
     type: typeof (isChecked ? true : false),
   });
   ```

2. **Debug Display**: In development mode, a small display shows the current state and type:
   ```tsx
   {
     process.env.NODE_ENV === 'development' && (
       <div className="mt-1 text-xs text-gray-400">
         Terminal state: {watch('wants_terminal') ? 'true' : 'false'}(
         {typeof watch('wants_terminal')})
       </div>
     );
   }
   ```

## Tooltip Implementation

The checkbox includes a helpful tooltip that appears on hover:

1. The tooltip uses a group hover approach with CSS transitions
2. It provides a clear explanation of what the Flash Terminal is
3. The tooltip is positioned above the checkbox to avoid covering other form elements
4. The z-index ensures it appears above other elements on the page

## Common Issues and Solutions

### Previously Fixed Issues

1. **Column Name Mismatch**:

   - **Issue**: Code was using `terminal_requested` but the database had `wants_terminal` column
   - **Solution**: Updated all references to use the correct column name

2. **Value Type Issues**:

   - **Issue**: Checkbox values weren't properly converting to boolean type
   - **Solution**: Added explicit boolean conversion at multiple points

3. **Form State Management**:
   - **Issue**: React Hook Form registration was causing inconsistent checkbox state
   - **Solution**: Bypassed registration and managed state manually with watch/setValue

### Troubleshooting

If the checkbox is not working correctly:

1. **Check Database Schema**: Verify the `wants_terminal` column exists in the `signups` table
2. **Inspect Form Data**: Use browser developer tools to check the form data before submission
3. **Review Console Logs**: Look for logs with the "💻" emoji to trace checkbox value flow
4. **Test Direct Submission**: Use the test submission utility to test the checkbox directly

## Testing

To test the terminal checkbox:

1. **Manual Testing**:

   - Open the form in development mode
   - Check and uncheck the terminal checkbox
   - Submit the form and verify the value in Supabase

2. **Automated Testing**:
   - Unit tests are available in the checkbox component tests

## Related Files

- `/app/form/components/BusinessInfoStep.tsx` - Checkbox implementation
- `/app/form/components/SignupForm.tsx` - Form handling and submission
- `/src/services/api.ts` - API service with database submission
- `/db/alter-table.sql` - Database schema definition
- `/src/types.ts` - TypeScript interface definitions
- `/lib/validators.ts` - Form validation schemas

## Future Improvements

Potential enhancements for the terminal checkbox feature:

1. **Additional Options**: Add sub-options for terminal preferences (e.g., model, features)
2. **Conditional Fields**: Show additional fields when checkbox is checked
3. **Visual Confirmation**: Add visual confirmation when checkbox is checked
4. **A/B Testing**: Test different wording or positioning for better conversion
