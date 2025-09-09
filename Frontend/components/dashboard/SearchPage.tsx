'use client'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchPageProps {
  onClose: () => void
}

export default function SearchPage({ onClose }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('posts') // posts, users, groups

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start pt-20">
      <div className="bg-white/10 border border-white/20 rounded-2xl shadow-xl w-full max-w-2xl mx-4">
        <div className="p-4 border-b border-white/20 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Search</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search for ${searchType}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 rounded-lg border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            />
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <button 
              onClick={() => setSearchType('posts')} 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${searchType === 'posts' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              Posts
            </button>
            <button 
              onClick={() => setSearchType('users')} 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${searchType === 'users' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              Users
            </button>
            <button 
              onClick={() => setSearchType('groups')} 
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${searchType === 'groups' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
              Groups
            </button>
          </div>
          <div className="mt-6 h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {/* Search results will be displayed here */}
            <p className="text-center text-white/50 mt-16">Search results will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
