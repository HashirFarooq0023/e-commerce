"""
Product Manager for handling store product catalog.
"""

from typing import List, Dict, Optional
import json
import os
from pathlib import Path


class ProductManager:
    """Manages product catalog and product-related operations."""
    
    def __init__(self, products_file: Optional[str] = None):
        """
        Initialize product manager.
        
        Args:
            products_file: Path to products JSON file
        """
        self.products_file = products_file or "data/products/products.json"
        self.products: List[Dict] = []
        Path(os.path.dirname(self.products_file)).mkdir(parents=True, exist_ok=True)
        self.load_products()
    
    def load_products(self):
        """Load products from file."""
        if os.path.exists(self.products_file):
            with open(self.products_file, 'r', encoding='utf-8') as f:
                self.products = json.load(f)
        else:
            self.products = []
            self.save_products()
    
    def save_products(self):
        """Save products to file."""
        with open(self.products_file, 'w', encoding='utf-8') as f:
            json.dump(self.products, f, indent=2, ensure_ascii=False)
    
    def add_product(
        self,
        name: str,
        description: str,
        price: float,
        category: str,
        stock: int = 0,
        image_url: Optional[str] = None,
        **kwargs
    ) -> Dict:
        """
        Add a new product to the catalog.
        
        Args:
            name: Product name
            description: Product description
            price: Product price
            category: Product category
            stock: Stock quantity
            image_url: Optional product image URL
            **kwargs: Additional product attributes
            
        Returns:
            Created product dictionary
        """
        product_id = str(len(self.products) + 1)
        product = {
            "id": product_id,
            "name": name,
            "description": description,
            "price": price,
            "category": category,
            "stock": stock,
            "image_url": image_url,
            **kwargs
        }
        self.products.append(product)
        self.save_products()
        return product
    
    def get_product(self, product_id: str) -> Optional[Dict]:
        """Get product by ID."""
        return next((p for p in self.products if p.get('id') == product_id), None)
    
    def search_products(
        self,
        query: str = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> List[Dict]:
        """
        Search products by various criteria.
        
        Args:
            query: Text search query (searches name and description)
            category: Filter by category
            min_price: Minimum price filter
            max_price: Maximum price filter
            
        Returns:
            List of matching products
        """
        results = self.products.copy()
        
        # Filter by category
        if category:
            results = [p for p in results if p.get('category', '').lower() == category.lower()]
        
        # Filter by price
        if min_price is not None:
            results = [p for p in results if p.get('price', 0) >= min_price]
        if max_price is not None:
            results = [p for p in results if p.get('price', float('inf')) <= max_price]
        
        # Text search
        if query:
            query_lower = query.lower()
            results = [
                p for p in results
                if query_lower in p.get('name', '').lower() or
                   query_lower in p.get('description', '').lower()
            ]
        
        return results
    
    def update_stock(self, product_id: str, quantity: int):
        """Update product stock quantity."""
        product = self.get_product(product_id)
        if product:
            product['stock'] = max(0, quantity)
            self.save_products()
    
    def get_categories(self) -> List[str]:
        """Get list of all product categories."""
        categories = set()
        for product in self.products:
            if 'category' in product:
                categories.add(product['category'])
        return sorted(list(categories))
    
    def format_product_for_display(self, product: Dict) -> str:
        """Format product information for display."""
        return (
            f"**{product.get('name', 'Unknown')}**\n"
            f"Price: ${product.get('price', 0):.2f}\n"
            f"Category: {product.get('category', 'N/A')}\n"
            f"Description: {product.get('description', 'N/A')}\n"
            f"Stock: {product.get('stock', 0)} available"
        )

