"use client"
import React from 'react'
import { User, Users, Plus, MessageCircle, Calendar, MapPin} from 'lucide-react'

// Clean DashboardSections: Categories, Followers, Groups, Settings

interface CategoriesSectionProps {
  categories: any[]
  trendingCategories: any[]
  selectedCategory: number | null
  setSelectedCategory: (id: number | null) => void
  categorySearchQuery: string
  setCategorySearchQuery: (q: string) => void
  categorySearchResults: any[]
  isSearching: boolean
  posts: any[]
  searchCategories: (q: string) => void
}

export function CategoriesSection({ categories, trendingCategories, selectedCategory, setSelectedCategory, categorySearchQuery, setCategorySearchQuery, categorySearchResults, isSearching, posts, searchCategories }: CategoriesSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Categories</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="mb-4">
              <input
                aria-label="Search categories"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchCategories(categorySearchQuery) }}
                className="w-full p-2 rounded-md bg-white/5 text-white"
                placeholder="Search categories..."
              />
            </div>

            <div>
              {isSearching ? (
                <div className="text-white/60">Searching...</div>
              ) : (categorySearchResults || []).length > 0 ? (
                (categorySearchResults || []).map((c) => (
                  <div key={c.id} className="p-3 mb-2 bg-white/3 rounded-md">
                    <button onClick={() => setSelectedCategory(c.id)} className="text-white">{c.name}</button>
                  </div>
                ))
              ) : (
                (categories || []).map((c) => (
                  <div key={c.id} className="p-3 mb-2 bg-white/3 rounded-md">
                    <button onClick={() => setSelectedCategory(c.id)} className={`text-white ${selectedCategory === c.id ? 'font-bold' : ''}`}>{c.name}</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside className="col-span-1">
            <h3 className="text-sm text-white/80 mb-2">Trending</h3>
            <div className="space-y-2">
              {(trendingCategories || []).map((tc) => (
                <div key={tc.id} className="p-2 bg-white/3 rounded-md text-white">{tc.name}</div>
              ))}
            </div>
          </aside>
        </div>

        <div className="mt-6">
          <h3 className="text-lg text-white/90 mb-3">Posts</h3>
          {(posts || []).length === 0 ? (
            <div className="text-white/60">No posts for this category.</div>
          ) : (
            (posts || []).map((p) => (
              <div key={p.id} className="p-3 mb-2 bg-white/3 rounded-md text-white">{p.content || p}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface FollowersSectionProps {
  followers: any[]
  following: any[]
  isLoadingFollowers: boolean
}

export function FollowersSection({ followers, following, isLoadingFollowers }: FollowersSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <h2 className="text-xl font-bold text-white mb-4">Followers</h2>
        {isLoadingFollowers ? (
          <div className="text-white/60">Loading...</div>
        ) : (followers || []).length === 0 ? (
          <div className="text-white/60">No followers yet.</div>
        ) : (
          (followers || []).map((f) => (
            <div key={f.id} className="flex items-center justify-between p-2 bg-white/3 rounded-md mb-2">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-white" />
                <div className="text-white">{f.first_name} {f.last_name}</div>
              </div>
              <button aria-label="Message" title="Message" className="text-white">Message</button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

interface Group {
  id: number
  name: string
  description: string
  members: number
  isJoined: boolean
  lastActivity: string
}

interface GroupsSectionProps {
  groups: Group[]
}

export function GroupsSection({ groups }: GroupsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">My Groups</h2>
          <button aria-label="Create Group" title="Create Group" className="flex items-center px-3 py-2 bg-emerald-500 rounded-md text-white">
            <Plus className="w-4 h-4 mr-2" /> Create
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-white/60">No groups yet.</div>
        ) : (
          (groups || []).map((g) => (
            <div key={g.id} className="p-3 mb-2 bg-white/3 rounded-md text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-white/70">{g.description}</div>
                </div>
                <button aria-label="Message Group" title="Message" className="text-white"><MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  )
}

interface SettingsSectionProps {
  currentUser: {
    isPrivate: boolean
  } | null
  testTokenExpiration: () => void
}

export function SettingsSection({ currentUser, testTokenExpiration }: SettingsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="bg-white/5 rounded-2xl p-4 lg:p-6">
        <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
        <div className="space-y-3">
          <div className="p-3 bg-white/3 rounded-md text-white">Privacy & Security</div>
          <div className="p-3 bg-white/3 rounded-md text-white">Notifications</div>
          <div className="p-3 bg-white/3 rounded-md text-white">
            <button onClick={testTokenExpiration} className="text-yellow-300">Test Token Expiration</button>
          </div>
        </div>
      </div>
    </div>
  )
}
