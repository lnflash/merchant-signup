import { NextResponse } from 'next/server';
import { signupFormSchema } from '../../../lib/validators';
import { supabase } from '../../../lib/supabase';

export async function POST(request: Request) {
  try {
    // Get form data from request
    const data = await request.json();
    
    // Validate form data
    const validatedData = signupFormSchema.parse(data);
    
    // Sanitize data (example: trim strings)
    Object.keys(validatedData).forEach(key => {
      if (typeof validatedData[key] === 'string') {
        validatedData[key] = validatedData[key].trim();
      }
    });
    
    // Insert data into Supabase
    const { error } = await supabase
      .from('signups')
      .insert([validatedData]);
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Signup successful' });
  } catch (error: any) {
    console.error('API error:', error);
    
    // Handle validation errors
    if (error.errors) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}