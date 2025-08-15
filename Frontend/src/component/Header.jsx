import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/clerk-react'
import React from 'react'
import { Box, Flex, Text, Button } from '@radix-ui/themes'

function Header() {
  const { user } = useUser()

  return (
    <Box 
      top="0" 
      left="0" 
      width="100%" 
      className="bg-[var(--gray-3)] border-b border-[var(--gray-6)] z-50 h-10"
    >
      <Flex align="center" justify="between" px="6" py="1" height="100%">
        <Text size="5" weight="bold" className="text-[var(--accent-11)]">Scribe</Text>
        <Flex align="center" gap="3">
          <SignedOut>
            <SignInButton>
              <Button variant="ghost" size="2">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="solid" size="2">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Flex align="center" gap="2">
              <UserButton showName={true}
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-8 w-8 rounded-full border border-gray-600 hover:border-gray-400",
                    userButtonPopoverCard: "bg-gray-900 border border-gray-700 rounded-lg shadow-lg",
                  }
                }}
              />
            </Flex>
          </SignedIn>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Header