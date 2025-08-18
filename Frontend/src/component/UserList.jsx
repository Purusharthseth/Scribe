import { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { ChevronDownIcon, PersonIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { Text, Flex, Box, Badge, DropdownMenu } from '@radix-ui/themes';

function UserList() {
  const { users, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);

  if (!isConnected || users.length === 0) {
    return null;
  }

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--gray-3)]/40 hover:bg-[var(--gray-4)]/60 border border-[var(--gray-6)] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent-8)] text-[var(--gray-11)] hover:text-[var(--gray-12)]">
          <PersonIcon className="w-4 h-4" />
          <Text size="1" weight="medium">Users</Text>
          <ChevronDownIcon 
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content variant='soft' side="bottom" align="end" sideOffset={8}>
        <div className="min-w-[280px]">
          <div className="px-3 py-2 border-b border-[var(--gray-6)]/30 mb-1">
            <Flex justify="between" align="center">
              <Text size="1" weight="medium" color="gray">
                Active Users
              </Text>
              <Badge size="1" variant="soft">
                {users.length} online
              </Badge>
            </Flex>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-1">
            {users.map((user) => (
              <div
                key={user.username}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[var(--accent-3)] cursor-default transition-all duration-150 group"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.avatarUrl || user.imageUrl} 
                    alt={user.fullName || user.username}
                    className="w-8 h-8 rounded-full object-cover shadow-sm ring-2 ring-[var(--gray-6)]/30 transition-all duration-200"
                  />
                  {user.isOwner && (
                    <div className="absolute -top-0.5 -right-0.5 bg-[var(--amber-9)] rounded-full p-0.5 ring-2 ring-[var(--gray-1)] shadow-sm">
                      <StarFilledIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                
                <Flex direction="column" className="flex-1 min-w-0">
                  <Text size="2" weight="medium" className="truncate group-hover:text-[var(--accent-11)] transition-colors">
                    {user.fullName || user.username}
                  </Text>
                  {user.fullName && user.username && (
                    <Text size="1" color="gray" className="truncate">
                      @{user.username}
                    </Text>
                  )}
                </Flex>

                <div className="w-2 h-2 bg-[var(--green-9)] rounded-full shadow-sm" title="Online" />
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="px-3 py-6 text-center">
              <PersonIcon className="w-6 h-6 text-[var(--gray-8)] mx-auto mb-2" />
              <Text size="1" color="gray">No users online</Text>
            </div>
          )}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export default UserList;
