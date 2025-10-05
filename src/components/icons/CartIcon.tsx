import React from 'react';

interface CartIconProps {
  size?: number;
  className?: string;
}

const CartIcon: React.FC<CartIconProps> = ({ size = 20, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Cart wheels */}
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      {/* Cart body and handle */}
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
};

export default CartIcon;
