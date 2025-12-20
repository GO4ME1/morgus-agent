/**
 * File Storage Tool for Morgus
 * 
 * Provides persistent file storage using Supabase Storage.
 * Files can be uploaded, downloaded, listed, and deleted.
 */

export interface FileStorageResult {
  success: boolean;
  message: string;
  url?: string;
  files?: Array<{
    name: string;
    size: number;
    created_at: string;
    url: string;
  }>;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  path: string,
  content: string | Uint8Array,
  contentType: string = 'application/octet-stream'
): Promise<FileStorageResult> {
  try {
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: content
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Failed to upload file: ${error}`
      };
    }

    // Get public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;

    return {
      success: true,
      message: `File uploaded successfully to ${path}`,
      url: publicUrl
    };
  } catch (error) {
    return {
      success: false,
      message: `Error uploading file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  path: string
): Promise<{ success: boolean; content?: string; message: string }> {
  try {
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to download file: ${response.statusText}`
      };
    }

    const content = await response.text();

    return {
      success: true,
      content,
      message: `File downloaded successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error downloading file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * List files in a Supabase Storage bucket
 */
export async function listFiles(
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  prefix: string = ''
): Promise<FileStorageResult> {
  try {
    const url = `${supabaseUrl}/storage/v1/object/list/${bucket}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix,
        limit: 100,
        offset: 0
      })
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to list files: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    const files = data.map((file: any) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      created_at: file.created_at,
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${prefix}${file.name}`
    }));

    return {
      success: true,
      message: `Found ${files.length} files`,
      files
    };
  } catch (error) {
    return {
      success: false,
      message: `Error listing files: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  path: string
): Promise<FileStorageResult> {
  try {
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to delete file: ${response.statusText}`
      };
    }

    return {
      success: true,
      message: `File deleted successfully`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Tool definitions for file storage
 */
export const fileStorageTools = {
  upload_file: {
    name: 'upload_file',
    description: 'Upload a file to persistent storage. Use this to save generated files (documents, images, code) that need to persist across sessions.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path/filename to save the file as (e.g., "reports/analysis.pdf")'
        },
        content: {
          type: 'string',
          description: 'The file content (text or base64 encoded for binary)'
        },
        content_type: {
          type: 'string',
          description: 'MIME type of the file (e.g., "application/pdf", "image/png")'
        }
      },
      required: ['path', 'content']
    }
  },
  
  download_file: {
    name: 'download_file',
    description: 'Download a file from persistent storage. Use this to retrieve previously saved files.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path/filename to download'
        }
      },
      required: ['path']
    }
  },
  
  list_files: {
    name: 'list_files',
    description: 'List files in persistent storage. Use this to see what files are available.',
    parameters: {
      type: 'object',
      properties: {
        prefix: {
          type: 'string',
          description: 'Optional prefix/folder to filter files (e.g., "reports/")'
        }
      },
      required: []
    }
  },
  
  delete_file: {
    name: 'delete_file',
    description: 'Delete a file from persistent storage.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path/filename to delete'
        }
      },
      required: ['path']
    }
  }
};
