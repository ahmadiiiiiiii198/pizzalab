-- Create a function to execute dynamic SQL for table creation
-- This allows the frontend to create tables automatically

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Security check: only allow CREATE TABLE, CREATE INDEX, CREATE TRIGGER statements
  IF sql_query !~* '^[\s\n]*(--.*)*(CREATE\s+(TABLE|INDEX|TRIGGER|FUNCTION)|DROP\s+TRIGGER|INSERT\s+INTO)' THEN
    RAISE EXCEPTION 'Only CREATE TABLE, CREATE INDEX, CREATE TRIGGER, DROP TRIGGER, and INSERT statements are allowed';
  END IF;
  
  -- Additional security: prevent dangerous operations
  IF sql_query ~* '(DROP\s+TABLE|DELETE\s+FROM|UPDATE\s+SET|ALTER\s+TABLE.*DROP)' THEN
    RAISE EXCEPTION 'Dangerous operations are not allowed';
  END IF;
  
  -- Execute the SQL
  EXECUTE sql_query;
  
  result := 'SQL executed successfully';
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error message instead of raising exception
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;

-- Create a table to track table creation requests (fallback method)
CREATE TABLE IF NOT EXISTS table_creation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_type_id UUID,
  table_name TEXT NOT NULL,
  sql_definition TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create indexes for table_creation_requests
CREATE INDEX IF NOT EXISTS idx_table_creation_requests_status ON table_creation_requests(status);
CREATE INDEX IF NOT EXISTS idx_table_creation_requests_table_name ON table_creation_requests(table_name);

-- Grant permissions for table_creation_requests
GRANT ALL ON table_creation_requests TO authenticated;

-- Create a function to process table creation requests
CREATE OR REPLACE FUNCTION process_table_creation_request(request_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result TEXT;
BEGIN
  -- Get the request
  SELECT * INTO request_record 
  FROM table_creation_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN 'Request not found or already processed';
  END IF;
  
  BEGIN
    -- Execute the SQL
    EXECUTE request_record.sql_definition;
    
    -- Update status to completed
    UPDATE table_creation_requests 
    SET status = 'completed', processed_at = NOW()
    WHERE id = request_id;
    
    result := 'Table created successfully: ' || request_record.table_name;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Update status to failed
      UPDATE table_creation_requests 
      SET status = 'failed', processed_at = NOW(), error_message = SQLERRM
      WHERE id = request_id;
      
      result := 'Error creating table: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_table_creation_request(UUID) TO authenticated;

-- Create a function to auto-process pending requests (can be called periodically)
CREATE OR REPLACE FUNCTION auto_process_table_requests()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  processed_count INTEGER := 0;
  result_text TEXT := '';
BEGIN
  -- Process all pending requests
  FOR request_record IN 
    SELECT * FROM table_creation_requests 
    WHERE status = 'pending' 
    ORDER BY created_at ASC
    LIMIT 10
  LOOP
    BEGIN
      -- Execute the SQL
      EXECUTE request_record.sql_definition;
      
      -- Update status to completed
      UPDATE table_creation_requests 
      SET status = 'completed', processed_at = NOW()
      WHERE id = request_record.id;
      
      processed_count := processed_count + 1;
      result_text := result_text || 'Created: ' || request_record.table_name || '; ';
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Update status to failed
        UPDATE table_creation_requests 
        SET status = 'failed', processed_at = NOW(), error_message = SQLERRM
        WHERE id = request_record.id;
        
        result_text := result_text || 'Failed: ' || request_record.table_name || ' (' || SQLERRM || '); ';
    END;
  END LOOP;
  
  IF processed_count = 0 THEN
    RETURN 'No pending requests to process';
  ELSE
    RETURN 'Processed ' || processed_count || ' requests: ' || result_text;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION auto_process_table_requests() TO authenticated;
