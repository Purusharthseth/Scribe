import useAxios from '@/utils/useAxios';
import React, { useEffect, useState } from 'react';
import { PlusIcon, DotsVerticalIcon, Pencil1Icon, TrashIcon, ReloadIcon, Link2Icon, CopyIcon, CheckIcon, Share1Icon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button, Card, Text, Heading, Flex, Box, Spinner, Dialog, TextField, DropdownMenu, Badge, Select } from '@radix-ui/themes';
import toast from 'react-hot-toast';

function Home() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vaultName, setVaultName] = useState('');
  const [clickedVault, setClickedVault] = useState(null);
  const [clickedAction, setClickedAction] = useState(null);
  const [shareMode, setShareMode] = useState('private');
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
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
    setClickedVault(vault);
    setVaultName(vault.name || '');
    setClickedAction('edit');
  };

  const handleUpdateVault = () => {
    if (!vaultName.trim() || !clickedVault) return;
    axiosInstance.put(`/api/vaults/${clickedVault.id}/name`, { name: vaultName })
      .then(() => {
        fetchVaults();
      }).catch(error => {
        console.error("Failed to update vault:", error);
      }).finally(() => {
        setVaultName('');
        setNameError(true);
        setClickedVault(null);
        setClickedAction(null);
      });
  };

  const handleDeleteVault = (vault) => {
    setClickedVault(vault);
    setClickedAction('delete');
  };
  
  const openShareDialog = (vault) => {
    setClickedVault(vault);
    setShareMode(vault.share_mode || 'private');
    setClickedAction('share');
  };

  const updateShareMode = async (mode) => {
    if (!clickedVault) return;
    try {
      setIsUpdatingShare(true);
      const res = await axiosInstance.put(`/api/vaults/${clickedVault.id}/shareMode`, { shareMode: mode });
      const updated = res.data.data;
      setVaults((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setClickedVault(updated);
      setShareMode(updated.share_mode || 'private');
    } catch (error) {
      toast.error('Failed to update share mode');
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const regenerateToken = async () => {
    if (!clickedVault) return;
    try {
      setIsRegenerating(true);
      const res = await axiosInstance.put(`/api/vaults/${clickedVault.id}/shareToken`);
      const updated = res.data.data;
      setVaults((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setClickedVault(updated);
    } catch (error) {
      console.error('Failed to regenerate token:', error.response?.data || error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const confirmDeleteVault = () => {
    if (!clickedVault) return;
    axiosInstance.delete(`/api/vaults/${clickedVault.id}`)
      .then(() => {
        fetchVaults();
      }).catch(error => {
        console.error("Failed to delete vault:", error.response?.data || error);
      }).finally(() => {
        setClickedVault(null);
        setClickedAction(null);
      });
  };

  const resetDialogs = () => {
    setVaultName('');
    setClickedVault(null);
    setClickedAction(null);
    setShareMode('private');
    setIsUpdatingShare(false);
    setIsRegenerating(false);
    setCopied(false);
    setNameError(true);
  };

  return (
    <Box p="8" className="max-w-7xl mx-auto">
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

      {/* Unified Vault Action Dialog */}
      <Dialog.Root open={!!clickedAction} onOpenChange={(open) => { if (!open) resetDialogs(); }}>
        <Dialog.Content maxWidth="560px" className="shadow-2xl">
          {clickedAction === 'edit' && (
            <>
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
            </>
          )}

          {clickedAction === 'delete' && (
            <>
              <Dialog.Title size="6" className="text-[var(--accent-11)]">Delete Vault</Dialog.Title>
              <Dialog.Description size="3" mb="6" color="gray">
                Are you sure you want to delete <strong>{clickedVault?.name}</strong>? This action cannot be undone.
              </Dialog.Description>
              <Flex gap="3" mt="6" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" size="3">Cancel</Button>
                </Dialog.Close>
                <Dialog.Close>
                  <Button variant="solid" color="red" onClick={confirmDeleteVault}>Delete Vault</Button>
                </Dialog.Close>
              </Flex>
            </>
          )}

          {clickedAction === 'share' && (
            <>
              <Flex justify="between" align="center" mb="3">
                <Dialog.Title size="6" className="text-[var(--accent-11)]">Share Vault</Dialog.Title>
                {clickedVault && (
                  <Badge color={shareMode === 'edit' ? 'green' : shareMode === 'view' ? 'blue' : 'gray'} variant="soft" radius="full">
                    {shareMode.toUpperCase()}
                  </Badge>
                )}
              </Flex>
              <Dialog.Description size="3" mb="5" color="gray">
                Choose who can access this vault. No link is shown in Private mode.
              </Dialog.Description>
              <Flex direction="column" gap="5">
                <div>
                  <Text as="div" size="3" mb="2" weight="medium" className="text-[var(--accent-11)]">Share mode</Text>
                  <Select.Root value={shareMode} onValueChange={updateShareMode} disabled={isUpdatingShare || !clickedVault}>
                    <Select.Trigger placeholder="Select mode" />
                    <Select.Content>
                      <Select.Item value="private">Private</Select.Item>
                      <Select.Item value="view">View (anyone with the link)</Select.Item>
                      <Select.Item value="edit">Edit (anyone with the link)</Select.Item>
                    </Select.Content>
                  </Select.Root>
                  {isUpdatingShare && <Text size="2" color="gray" className="mt-2">Updating…</Text>}
                </div>
                {clickedVault && shareMode !== 'private' && clickedVault.share_token ? (
                  <Box className="border border-[var(--gray-6)] bg-[var(--gray-2)] rounded-md p-3">
                    <Flex align="center" gap="2" mb="2">
                      <Link2Icon width="16" height="16" className="text-[var(--accent-10)]" />
                      <Text weight="medium">Share link</Text>
                    </Flex>
                    <Flex gap="2" align="center">
                      <TextField.Root
                        readOnly
                        value={`${window.location.origin}/vault/${clickedVault.id}?shareToken=${clickedVault.share_token}`}
                        className="flex-1"
                      />
                      <Button
                        variant="soft"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`${window.location.origin}/vault/${clickedVault.id}?shareToken=${clickedVault.share_token}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch {}
                        }}
                      >
                        {copied ? <CheckIcon width="14" height="14" /> : <CopyIcon width="14" height="14" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button variant="soft" color="gray" disabled={isRegenerating} onClick={regenerateToken}>
                        <ReloadIcon width="14" height="14" />
                        {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                      </Button>
                    </Flex>
                  </Box>
                ) : (
                  <Text size="2" color="gray">No link available in Private mode.</Text>
                )}
              </Flex>
              <Flex gap="3" mt="6" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" size="3">Close</Button>
                </Dialog.Close>
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>

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
                      <DropdownMenu.Item onClick={() => openShareDialog(vault)} className='cursor-pointer'>
                        <Share1Icon width="14" height="14" />
                        Share
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