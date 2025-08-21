'use client'
import React from 'react'

interface CategoryBadgeProps {
  category: {
    id: number
    name: string
    color: string
    icon: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium text-white
        ${sizeClasses[size]} 
        ${className}
      `}
      style={{ backgroundColor: category.color }}
    >
      <span className="mr-1">
        {getIconByName(category.icon)}
      </span>
      {category.name}
    </span>
  )
}

function getIconByName(iconName: string): string {
  const iconMap: { [key: string]: string } = {
    'message-circle': '💬',
    'cpu': '💻',
    'trophy': '🏆', 
    'film': '🎬',
    'newspaper': '📰',
    'map-pin': '📍',
    'utensils': '🍽️',
    'heart': '❤️',
    'book-open': '📖',
    'palette': '🎨',
    'folder': '📁'
  }
  
  return iconMap[iconName] || '📁'
}

export default CategoryBadge