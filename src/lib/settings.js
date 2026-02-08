import db from "./db";
// Function to GET settings
export async function getSiteSettings() {
  const rows = await db('SELECT * FROM site_settings WHERE id = 1');
  return rows.length > 0 ? rows[0] : {};
}

// Function to UPDATE settings
export async function updateSiteSettings(data) {
  const sql = `
    UPDATE site_settings 
    SET 
      brand_name = ?, brand_description = ?, email_address = ?, 
      helpline_number = ?, whatsapp_number = ?, 
      facebook_url = ?, instagram_url = ?, tiktok_url = ?, snapchat_url = ?
    WHERE id = 1
  `;

  const values = [
    data.brand_name || '', 
    data.brand_description || '', 
    data.email_address || '',
    data.helpline_number || '', 
    data.whatsapp_number || '',
    data.facebook_url || '', 
    data.instagram_url || '', 
    data.tiktok_url || '', 
    data.snapchat_url || ''
  ];

  return await db(sql, values);
}