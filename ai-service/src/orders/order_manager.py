"""
Order Manager for handling customer orders.
"""

from typing import List, Dict, Optional
import json
import os
from datetime import datetime
from pathlib import Path
from .order_schema import Order, OrderItem, OrderStatus


class OrderManager:
    """Manages customer orders."""
    
    def __init__(self, orders_file: Optional[str] = None):
        """
        Initialize order manager.
        
        Args:
            orders_file: Path to orders JSON file
        """
        self.orders_file = orders_file or "data/orders/orders.json"
        self.orders: List[Dict] = []
        Path(os.path.dirname(self.orders_file)).mkdir(parents=True, exist_ok=True)
        self.load_orders()
    
    def load_orders(self):
        """Load orders from file."""
        if os.path.exists(self.orders_file):
            with open(self.orders_file, 'r', encoding='utf-8') as f:
                self.orders = json.load(f)
        else:
            self.orders = []
            self.save_orders()
    
    def save_orders(self):
        """Save orders to file."""
        with open(self.orders_file, 'w', encoding='utf-8') as f:
            json.dump(self.orders, f, indent=2, ensure_ascii=False)
    
    def create_order(self, order_id: Optional[str] = None) -> Order:
        """
        Create a new order.
        
        Args:
            order_id: Optional order ID (auto-generated if not provided)
            
        Returns:
            Created order object
        """
        if order_id is None:
            order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{len(self.orders) + 1:04d}"
        
        order = Order(order_id=order_id)
        return order
    
    def add_order(self, order: Order):
        """Add order to the system."""
        order_dict = order.to_dict()
        self.orders.append(order_dict)
        self.save_orders()
    
    def get_order(self, order_id: str) -> Optional[Order]:
        """Get order by ID."""
        order_dict = next((o for o in self.orders if o.get('order_id') == order_id), None)
        if order_dict:
            return Order.from_dict(order_dict)
        return None
    
    def update_order(self, order: Order):
        """Update existing order."""
        for i, o in enumerate(self.orders):
            if o.get('order_id') == order.order_id:
                self.orders[i] = order.to_dict()
                self.save_orders()
                return
        # If not found, add it
        self.add_order(order)
    
    def get_orders_by_status(self, status: str) -> List[Order]:
        """Get orders by status."""
        orders = [Order.from_dict(o) for o in self.orders if o.get('status') == status]
        return orders
    
    def format_order_for_display(self, order: Order) -> str:
        """Format order information for display."""
        items_text = "\n".join([
            f"  - {item.product_name} x{item.quantity} @ ${item.price:.2f} = ${item.total:.2f}"
            for item in order.items
        ])
        
        return (
            f"**Order ID:** {order.order_id}\n"
            f"**Customer:** {order.customer_name or 'N/A'}\n"
            f"**Phone:** {order.phone_number or 'N/A'}\n"
            f"**Address:** {order.address or 'N/A'}\n"
            f"**Status:** {order.status}\n"
            f"**Items:**\n{items_text}\n"
            f"**Total:** ${order.total:.2f}"
        )

