import db from "./db";

// 1. GET ALL PRODUCTS (Home Page)
export async function getProducts() {
  try {
    const query = "SELECT * FROM products ORDER BY created_at DESC";
    const [rows] = await db.execute(query);

    return rows.map((p) => {
      //  FIX START: Parse images JSON safely here
      let gallery = [];
      try {
        // If it's a string, parse it. If it's null/undefined, make it empty array.
        gallery = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
      } catch (e) {
        gallery = [];
      }
      // Ensure it is definitely an array
      if (!Array.isArray(gallery)) gallery = [];
      //  FIX END

      return {
        ...p,
        _id: p.id.toString(), 
        name: p.name || "Untitled Product",
        price: Number(p.price) || 0,
        category: p.category || "Uncategorized",
        image: p.image || "https://placehold.co/600x400?text=No+Image", // Main Thumbnail
        
        images: gallery, 
        
        description: p.description || "No description available",
        stock: p.stock || 0,
        createdAt: p.created_at ? p.created_at.toISOString() : null,
        updatedAt: p.updated_at ? p.updated_at.toISOString() : null,
      };
    });
  } catch (error) {
    console.error("❌ Error in getProducts:", error);
    return [];
  }
}

// gettting categories 
export async function getAllCategories() {
  try {
    const query = "SELECT DISTINCT category FROM products ORDER BY category ASC";
    const [rows] = await db.execute(query);
    return rows.map(row => row.category).filter(Boolean);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}




//  GET SINGLE PRODUCT (Details Page)
export async function getProductById(id) {
  try {
    if (!id) return null;

    const query = "SELECT * FROM products WHERE id = ?";
    const [rows] = await db.execute(query, [id]);
    const p = rows[0];

    if (!p) return null;

    //   Convert JSON string back to Array
    let gallery = [];
    try {
      gallery = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
    } catch (e) {
      console.error("Failed to parse images JSON:", e);
      gallery = []; 
    }

    return {
      ...p,
      _id: p.id.toString(),
      price: Number(p.price),
      image: p.image,         // Main Thumbnail
      images: gallery || [],   // Full Gallery Array
      createdAt: p.created_at ? p.created_at.toISOString() : null,
      updatedAt: p.updated_at ? p.updated_at.toISOString() : null,
    };
  } catch (error) {
    console.error(" Error in getProductById:", error);
    return null;
  }
}

// 3. CREATE PRODUCT (Supports 5 Images)
export async function createProduct(productData) {
  try {
    const { name, price, category, description, stock, images } = productData;

    // 🟢 VALIDATION: Max 5 Images
    const imageList = Array.isArray(images) ? images : [];
    if (imageList.length > 5) {
      return { success: false, error: "Maximum 5 images allowed" };
    }

    // 🟢 AUTO-THUMBNAIL: Use the first image as the main 'image'
    const mainImage = imageList.length > 0 ? imageList[0] : "https://placehold.co/600x400?text=No+Image";

    // Prepare JSON for storage
    const imagesJson = JSON.stringify(imageList);

    const query = `
      INSERT INTO products 
      (name, price, category, image, images, description, stock, rating, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `;

    const values = [
      name,
      parseFloat(price),
      category,
      mainImage,   // Saves to 'image' column
      imagesJson,  // Saves to 'images' column
      description,
      parseInt(stock) || 0
    ];

    const [result] = await db.execute(query, values);

    return { success: true, newId: result.insertId.toString() };
  } catch (error) {
    console.error("❌ Error in createProduct:", error);
    return { success: false, error: error.message };
  }
}

// 4. UPDATE PRODUCT (Handles Dynamic Updates)
export async function updateProduct(id, updateData) {
  try {
    const { _id, images, ...fieldsToUpdate } = updateData;
    const values = [];
    const updates = [];

    // 1. Loop through normal fields (name, price, etc.)
    Object.keys(fieldsToUpdate).forEach((key) => {
      updates.push(`${key} = ?`);
      values.push(fieldsToUpdate[key]);
    });

    // 2. Handle Images specifically
    if (images && Array.isArray(images)) {
      if (images.length > 5) return { success: false, error: "Max 5 images allowed" };

      // Update the gallery JSON
      updates.push("images = ?");
      values.push(JSON.stringify(images));

      // Automatically update the main thumbnail if images exist
      if (images.length > 0) {
        updates.push("image = ?");
        values.push(images[0]);
      }
    }

    if (updates.length === 0) return { success: false, error: "No fields to update" };

    // Add ID for the WHERE clause
    values.push(id);

    const query = `UPDATE products SET ${updates.join(", ")}, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.execute(query, values);

    return { success: true, modifiedCount: result.affectedRows };
  } catch (error) {
    console.error("❌ Error in updateProduct:", error);
    return { success: false, error: error.message };
  }
} 

// DELETE PRODUCT
export async function deleteProduct(id) {
  try {
    const query = "DELETE FROM products WHERE id = ?";
    const [result] = await db.execute(query, [id]);

    return { success: true, deletedCount: result.affectedRows };
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error);
    return { success: false, error: error.message };
  }
}