import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Box,
  Input,
  Button,
  Flex,
} from "@chakra-ui/react";
import { MdOutlineEmail } from "react-icons/md";
import { useLocalStorage } from "../../hooks/useLocalStorage"; // Import the custom hook

interface EmailPopoverProps {
  rowIndex: number;
  col: { name: string };
  row: { [key: string]: any };
}

const EmailPopover: React.FC<EmailPopoverProps> = ({
  rowIndex,
  col,
  row,
}) => {
  
  const [email, setEmail] = useLocalStorage<string>(`${rowIndex}_${col.name}`, row[col.name] || "");

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail); 
    row[col.name] = newEmail; 
  };

  const [tagPopoverRow, setTagPopoverRow] = useState<{
    rowIndex: number;
    colName: string;
  } | null>(null);

  return (
    <Popover
      isOpen={
        tagPopoverRow?.rowIndex === rowIndex &&
        tagPopoverRow?.colName === col.name
      }
      onClose={() => setTagPopoverRow(null)}
      placement="bottom-start"
    >
      <PopoverTrigger>
        <Box
          onClick={() => setTagPopoverRow({ rowIndex, colName: col.name })}
          cursor="pointer"
          minHeight="20px"
          width="100%"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          borderRadius="8px"
          padding="8px"
        >
          <span>{email}</span> 
        </Box>
      </PopoverTrigger>

      <PopoverContent
        width="250px"
        color="gray"
        borderRadius="10px"
        boxShadow="lg"
        minWidth="100px"
        border="1px solid"
        borderColor="gray.400"
        marginTop="-8px"
      >
        <PopoverArrow />
        <PopoverBody padding="5px">
          <Flex direction="column" gap="4px">
            <Input
              type="email"
              value={email} 
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Enter email"
              size="sm"
              mb="4px"
            />

            <Button
              onClick={() => (window.location.href = `mailto:${email}`)}
              colorScheme="blue"
              variant="outline"
              size="sm"
            >
              <MdOutlineEmail style={{ width: "17px", height: "17px" }} />
            </Button>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default EmailPopover;
