import React from 'react'
import { Box, Container, Heading, Text, Button, Flex } from '@radix-ui/themes'

function LandingPage() {
  return (
    <Container size="3" className="text-center pt-30">
      <Heading size="8" mb="4" className="text-[var(--blue-11)]">
        Welcome to Scribe
      </Heading>
      <Text size="5" color="gray" mb="6" className="max-w-xl mx-auto">
        Your modern markdown editor and document vault. Organize, write, and collaborate seamlessly.
      </Text>
      <Flex gap="4" justify="center">
        <Button size="4" variant="solid">
          Get Started
        </Button>
        <Button size="4" variant="outline">
          Learn More
        </Button>
      </Flex>
    </Container>
  )
}

export default LandingPage