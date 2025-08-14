import useAxios from '@/utils/useAxios';
import React, { useEffect, useState } from 'react';
import { PlusIcon, DotsVerticalIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button, Card, Text, Heading, Flex, Box, Spinner, Dialog, TextField, DropdownMenu, AlertDialog } from '@radix-ui/themes';

function Home() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [editingVault, setEditingVault] = useState(null);
  const [deletingVault, setDeletingVault] = useState(null);
  const [nameError, setNameError] = useState(true);
  const axiosInstance = useAxios();

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

  useEffect(() => {
    fetchVaults();
  }, []);

  useEffect(() => {
    setNameError(vaultName.trim() === '');
  }, [vaultName]);

  const handleCreateVault = () => {
    if (!vaultName.trim()) return;
    axiosInstance.post("/api/vaults", { name: vaultName })
      .then(() => {
        fetchVaults();
      }).catch(error => {
        console.error("Failed to create vault:", error);
      }).finally(() => {
        console.log("Creating vault:", { name: vaultName });
        setVaultName('');
        setNameError(true);
        setIsDialogOpen(false);
      });
  };

  const handleEditVault = (vault) => {
    setEditingVault(vault);
    setVaultName(vault.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateVault = () => {
    if (!vaultName.trim() || !editingVault) return;
    axiosInstance.put(`/api/vaults/${editingVault.id}/name`, { name: vaultName })
      .then(() => {
        fetchVaults();
      }).catch(error => {
        console.error("Failed to update vault:", error);
      }).finally(() => {
        console.log("Updating vault:", { id: editingVault.id, name: vaultName });
        setVaultName('');
        setEditingVault(null);
        setNameError(true);
        setIsEditDialogOpen(false);
      });
  };

  const handleDeleteVault = (vault) => {
    setDeletingVault(vault);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteVault = () => {
    if (!deletingVault) return;
    axiosInstance.delete(`/api/vaults/${deletingVault.id}`)
      .then(() => {
        fetchVaults();
      }).catch(error => {
        console.error("Failed to delete vault:", error.response?.data || error);
      }).finally(() => {
        console.log("Deleting vault:", { id: deletingVault.id });
        setDeletingVault(null);
        setIsDeleteDialogOpen(false);
      });
  };

  const resetDialogs = () => {
    setVaultName('');
    setEditingVault(null);
    setDeletingVault(null);
    setNameError(true);
  };

  return (
    <Box p="8" className="max-w-7xl mx-auto">
      {/* Header Section */}
      <Flex justify="between" align="center" mb="12" className="border-b border-[var(--gray-6)] pb-8">
        <div>
          <Heading size="8" className="text-[var(--accent-11)] mb-2">Your Vaults</Heading>
          <Text size="3" color="gray">Organize your documents and ideas</Text>
        </div>
        
        {/* Create Vault Dialog */}
        <Dialog.Root open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetDialogs(); }}>
          <Dialog.Trigger>
            <Button size="3" radius="full" className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <PlusIcon width="16" height="16" />
              New Vault
            </Button>
          </Dialog.Trigger>
          <Dialog.Content maxWidth="480px" className="shadow-2xl">
            <Dialog.Title size="6" className="text-[var(--accent-11)]">Create New Vault</Dialog.Title>
            <Dialog.Description size="3" mb="6" color="gray">
              Create a new vault to organize your documents and notes securely.
            </Dialog.Description>
            <Flex direction="column" gap="4">
              <label>
                <Text as="div" size="3" mb="2" weight="medium" className="text-[var(--accent-11)]">
                  Vault Name
                </Text>
                <TextField.Root
                  size="3"
                  placeholder="Enter a descriptive name..."
                  value={vaultName}
                  onChange={(e) => setVaultName(e.target.value)}
                  className="focus:ring-2 focus:ring-[var(--accent-8)]"
                />
              </label>
              {nameError && (
                <Text color="red" size="2" weight="medium">The vault name cannot be empty</Text>
              )}
            </Flex>
            <Flex gap="3" mt="6" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" size="3">
                  Cancel
                </Button>
              </Dialog.Close>
              <Dialog.Close>
                <Button disabled={nameError} onClick={handleCreateVault} size="3" className="shadow-md">
                  Create Vault
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>

      {/* Edit Vault Dialog */}
      <Dialog.Root open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetDialogs(); }}>
        <Dialog.Content maxWidth="480px" className="shadow-2xl">
          <Dialog.Title size="6" className="text-[var(--accent-11)]">Edit Vault</Dialog.Title>
          <Dialog.Description size="3" mb="6" color="gray">
            Update your vault name.
          </Dialog.Description>
          <Flex direction="column" gap="4">
            <label>
              <Text as="div" size="3" mb="2" weight="medium" className="text-[var(--accent-11)]">
                Vault Name
              </Text>
              <TextField.Root
                size="3"
                placeholder="Enter a descriptive name..."
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="focus:ring-2 focus:ring-[var(--accent-8)]"
              />
            </label>
            {nameError && (
              <Text color="red" size="2" weight="medium">The vault name cannot be empty</Text>
            )}
          </Flex>
          <Flex gap="3" mt="6" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" size="3">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button disabled={nameError} onClick={handleUpdateVault} size="3" className="shadow-md">
                Update Vault
              </Button>
            </Dialog.Close>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      {/* Delete Vault Dialog */}
      <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Delete Vault</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure you want to delete <strong >{deletingVault?.name}</strong>? This action cannot be undone and all documents in this vault will be lost.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button variant="solid" color="red" onClick={confirmDeleteVault}>
                Delete Vault
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Content Section */}
      {loading ? (
        <Flex justify="center" align="center" className="h-96">
          <div className="text-center">
            <Spinner size="3" className="mb-4" />
            <Text size="3" color="gray">Loading your vaults...</Text>
          </div>
        </Flex>
      ) : vaults.length === 0 ? (
        <Card className="py-24 cursor-pointer px-8 border-2 border-dashed border-[var(--accent-6)] bg-gradient-to-br from-[var(--gray-1)] to-[var(--gray-2)]"
        onClick={() => setIsDialogOpen(true)}>
          <div className="text-center max-w-md mx-auto">
            <div className="bg-[var(--accent-3)] rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <PlusIcon className="w-8 h-8 text-[var(--accent-11)]" />
            </div>
            <Heading size="5" mb="3" className="text-[var(--accent-11)]">No vaults yet</Heading>
            <Text size="3" color="gray" className="leading-relaxed">
              Get started by creating your first vault to organize your documents and ideas.
            </Text>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 mt-10 lg:grid-cols-3 gap-8">
          {vaults.map((vault) => (
            <Card 
              key={vault.id} 
              className="transition-colors duration-150 border border-[var(--accent-6)] hover:border-[var(--accent-8)] hover:border bg-gradient-to-br from-[var(--gray-1)] to-[var(--gray-2)] group"
              asChild 
              variant='classic'
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Heading size="5">
                    {vault.name}
                  </Heading>
                  
                  {/* Vault Actions Dropdown */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <DotsVerticalIcon width="14" height="14" className='cursor-pointer'/>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content variant='soft'>
                      <DropdownMenu.Item onClick={() => handleEditVault(vault)} className='cursor-pointer'>
                        <Pencil1Icon width="14" height="14" />
                        Edit Name
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item color="red" onClick={() => handleDeleteVault(vault)} className='cursor-pointer'>
                        <TrashIcon width="14" height="14" />
                        Delete Vault
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </div>
                
                <div className="space-y-3">
                  <Flex direction="column">
                    <Text size="2" weight="medium" className="text-[var(--accent-10)]">Created at</Text>
                    <Text size="1" color="gray" className="font-mono" >
                      {new Date(vault.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </Flex>
                  <div className="pt-3 border-t border-[var(--gray-6)]">
                    <Text
                      asChild
                      size="1"
                      weight={'light'}
                      className="uppercase cursor-pointer tracking-wider font-medium  transition-colors group-hover:text-[var(--accent-10)]"
                    >
                      <Link to={`/vault/${vault.id}`}>Click to open →</Link>
                    </Text>
                  </div>
                </div>
              </div>
            </Card>

          ))}
        </div>
      )}
    </Box>
  );
}

export default Home;