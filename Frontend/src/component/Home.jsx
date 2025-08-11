import useAxios from '@/utils/useAxios';
import React, { useEffect, useState } from 'react';
import { PlusIcon } from '@radix-ui/react-icons';
import { Button, Card, Text, Heading, Flex, Box, Spinner } from '@radix-ui/themes';

function Home() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/vaults");
        setVaults(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch vaults:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVaults();
  }, [axiosInstance]);

  return (
    <Box p="6" className="max-w-7xl mx-auto min-h-screen">
      <Flex justify="between" align="center" mb="8">
        <Heading size="6">Your Vaults</Heading>
        <Button size="3">
          <PlusIcon width="16" height="16" />
          New Vault
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" className="h-64">
          <Spinner size="3" />
        </Flex>
      ) : vaults.length === 0 ? (
        <Card className="text-center py-16 px-4">
          <PlusIcon className="mx-auto h-12 w-12 opacity-60" />
          <Heading size="3" mt="4">No vaults yet</Heading>
          <Text size="2" color="gray" mt="1">Get started by creating a new vault.</Text>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault) => (
            <Card key={vault.id} className="cursor-pointer transition-all duration-200 hover:shadow-lg" asChild>
              <div>
                <Heading size="4" mb="2">{vault.name}</Heading>
                <Text size="2" color="gray" className="line-clamp-2 mb-4">
                  {vault.description || 'No description'}
                </Text>
                <Flex align="center" gap="2">
                  <Text size="1" color="gray">{new Date(vault.created_at).toLocaleDateString()}</Text>
                  <Text size="1" color="gray">•</Text>
                  <Text size="1" color="gray">{vault.files_count || 0} files</Text>
                </Flex>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Box>
  );
}

export default Home;