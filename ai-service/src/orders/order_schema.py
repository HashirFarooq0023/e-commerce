"""
Order schema and data models.
"""

from typing import List, Dict, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum


class OrderStatus(Enum):
    """Order status enumeration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


@dataclass
class OrderItem:
    """Order item data class."""
    product_id: str
    product_name: str
    quantity: int
    price: float
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'OrderItem':
        """Create from dictionary."""
        return cls(**data)
    
    @property
    def total(self) -> float:
        """Calculate item total."""
        return self.quantity * self.price


@dataclass
class Order:
    """Order data class."""
    order_id: str
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    items: Optional[List[OrderItem]] = None
    status: str = OrderStatus.PENDING.value
    created_at: Optional[str] = None
    notes: Optional[str] = None
    
    def __post_init__(self):
        """Initialize default values."""
        if self.items is None:
            self.items = []
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        data = asdict(self)
        data['items'] = [item.to_dict() for item in self.items]
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Order':
        """Create from dictionary."""
        items = [OrderItem.from_dict(item) for item in data.get('items', [])]
        data['items'] = items
        return cls(**data)
    
    def add_item(self, item: OrderItem):
        """Add item to order."""
        self.items.append(item)
    
    def remove_item(self, product_id: str):
        """Remove item from order."""
        self.items = [item for item in self.items if item.product_id != product_id]
    
    @property
    def total(self) -> float:
        """Calculate order total."""
        return sum(item.total for item in self.items)
    
    @property
    def is_complete(self) -> bool:
        """Check if order has all required information."""
        return (
            self.customer_name is not None and
            self.phone_number is not None and
            self.address is not None and
            len(self.items) > 0
        )

