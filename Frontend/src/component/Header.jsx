import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react'
import React from 'react'

function Header() {
  const { user } = useUser()

  return (
    <div className="fixed top-0 left-0 w-full bg-gray-800 text-white px-6 py-1 shadow-md z-50 h-10 flex items-center justify-between">
      <div className="text-xl font-bold text-blue-400">Scribe</div>
      <div className="flex items-center space-x-3">
        <SignedOut>
          <SignInButton>
            <button className="bg-gray-800 cursor-pointer hover:bg-gray-700 text-gray-200 px-4 py-1 rounded-full text-sm font-medium 
                            transition-colors duration-200 border border-black focus:outline-none">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="bg-blue-800 cursor-pointer hover:bg-blue-700 text-blue-100 px-4 py-1 rounded-full text-sm font-medium 
                            transition-colors duration-200 border border-blue-900 focus:outline-none">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <div className="flex items-center space-x-2">
            <UserButton showName={true}
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8 rounded-full border border-black hover:border-gray-500",
                  userButtonPopoverCard: "bg-gray-800 border border-gray-900 rounded-lg",
                  
                }
              }}
            />
          </div>
        </SignedIn>
      </div>
    </div>
  )
}

export default Header