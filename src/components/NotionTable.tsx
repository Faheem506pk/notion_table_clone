import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  useDisclosure,
  Text,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import "react-tagsinput/react-tagsinput.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Header from "./Header";
import RowActions from "./RowActions";
import styles from "../assets/CSS/main.module.css";
import ColumnPropertyEdit from "./ColumnPropertyEdit";
import AddNewColumn from "./AddNewColumn";
import SelectPopover from "./Datatype/Select";
import MultiSelect from "./Datatype/MultiSelect";
import StatusPopover from "./Datatype/Status";
import EmailPopover from "./Datatype/Email";
import PhonePopover from "./Datatype/Phone";
import DateInput from "./Datatype/Date";
import NumberInput from "./Datatype/Number";
import CnicInput from "./Datatype/CNIC";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useColorMode } from "@chakra-ui/react";


interface Column {
  name: string;
  dataType: string;
  width: number;
}

interface Row {
  [key: string]: any;
}

const NotionTable: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { onClose } = useDisclosure();
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  const [selectOptions, setSelectOptions] = useState<string[]>(() => {
    const savedOptions = localStorage.getItem("selectOptions");
    return savedOptions ? JSON.parse(savedOptions) : [];
  });
  useEffect(() => {
    try {
      localStorage.setItem("selectOptions", JSON.stringify(selectOptions));
    } catch (e) {
      console.error("Error saving options to local storage:", e);
    }
  }, [selectOptions]);

  const [tagsOptions, setTagsOptions] = useState<string[]>(() => {
    const savedOptions = localStorage.getItem("tagsOptions");
    return savedOptions ? JSON.parse(savedOptions) : [];
  });
  useEffect(() => {
    try {
      localStorage.setItem("tagsOptions", JSON.stringify(tagsOptions));
    } catch (e) {
      console.error("Error saving options to local storage:", e);
    }
  }, [tagsOptions]);

  const { colorMode } = useColorMode();
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    colIndex: number;
  } | null>(null);

  const [columns, setColumns] = useLocalStorage<Column[]>("columns", [
    { name: "Name", dataType: "string", width: 150 },
    { name: "Father Name", dataType: "string", width: 150 },
    { name: "Date of Birth", dataType: "date", width: 150 },
    { name: "Multi Select", dataType: "tags", width: 100 },
  ]);

  const [rows, setRows] = useLocalStorage<Row[]>(
    "rows",
    Array.from({ length: 7 }, () => ({
      Name: "",
      "Father Name": "",
      "Date of Birth": null,
      "Multi Select": "",
    }))
  );

  // //------------------------------------------------------------------------------
  // //========================== Column handle  ====================================
  // //------------------------------------------------------------------------------
  const handleAddColumn = (type: string, name: string) => {
    if (name) {
      let newName = name;
      let counter = 1;
      while (columns.some((column) => column.name === newName)) {
        newName = `${name}${counter}`;
        counter++;
      }
      const newColumn: Column = {
        name: newName,
        dataType: type,
        width: 150,
      };

      setColumns((prevColumns) => [...prevColumns, newColumn]);
      setRows((prevRows) =>
        prevRows.map((row) => ({
          ...row,
          [newName]: type === "select" ? "" : "",
        }))
      );
      onClose();
    }
    console.log(`Added column of type: ${type} with name: ${name}`);
  };

  const handleDeleteColumn = (columnName: string) => {
    const updatedColumns = columns.filter((col) => col.name !== columnName);
    const updatedRows = rows.map((row) => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    setColumns(updatedColumns);
    setRows(updatedRows);
  };

  const handleChangeColumnName = (index: number, newName: string) => {
    if (newName) {
      const updatedRows = rows.map((row) => {
        const newRow = { ...row };
        if (columns[index].name !== newName) {
          newRow[newName] = newRow[columns[index].name];
          delete newRow[columns[index].name];
        }
        return newRow;
      });

      setRows(updatedRows);

      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        newColumns[index].name = newName;
        return newColumns;
      });
    }
  };

  const sortColumn = (colIndex: number, order: "asc" | "desc") => {
    const sortedRows = [...rows].sort((a, b) => {
      const valA = a[columns[colIndex].name];
      const valB = b[columns[colIndex].name];

      const isEmpty = (value: any) =>
        value == null || (typeof value === "string" && value.trim() === "");

      if (isEmpty(valA) && isEmpty(valB)) return 0;
      if (isEmpty(valA)) return 1;
      if (isEmpty(valB)) return -1;

      if (typeof valA === "number" && typeof valB === "number") {
        return order === "asc" ? valA - valB : valB - valA;
      } else if (typeof valA === "string" && typeof valB === "string") {
        return order === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else if (valA instanceof Date && valB instanceof Date) {
        return order === "asc"
          ? valA.getTime() - valB.getTime()
          : valB.getTime() - valA.getTime();
      }

      return 0;
    });
    setRows(sortedRows);
  };

  // //------------------------------------------------------------------------------
  // //========================== Row handle  ====================================
  // //------------------------------------------------------------------------------

  const handleAddRow = () => {
    const newRow: Row = {};
    columns.forEach((col) => {
      newRow[col.name] = "";
    });
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleAddRowUnder = (index?: number) => {
    const newRow: Row = {};
    columns.forEach((col) => {
      newRow[col.name] = "";
    });

    if (typeof index === "number") {
      const updatedRows = [...rows];
      updatedRows.splice(index + 1, 0, newRow);
      setRows(updatedRows);
    } else {
      setRows([...rows, newRow]);
    }
  };

  const handleSelectAllRows = () => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.size === rows.length) {
      newSelectedRows.clear();
    } else {
      rows.forEach((_, index) => newSelectedRows.add(index));
    }
    setSelectedRows(newSelectedRows);
  };

  const handleDeleteSelectedRows = () => {
    const remainingRows = rows.filter((_, index) => !selectedRows.has(index));
    setRows(remainingRows); // Update rows state
    setSelectedRows(new Set()); // Clear selection
  };

  const handleSelectRow = (rowIndex: number) => {
    const newSelectedRows = new Set(selectedRows);

    if (newSelectedRows.has(rowIndex)) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);
  };

  const handleMouseDown = (index: number) => (event: React.MouseEvent) => {
    const startX = event.clientX;
    const startWidth = columns[index].width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(startWidth + moveEvent.clientX - startX, 50);
      setColumns((prevColumns) =>
        prevColumns.map((col, i) =>
          i === index ? { ...col, width: newWidth } : col
        )
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // //------------------------------------------------------------------------------
  // //========================== Drag handle  ====================================
  // //------------------------------------------------------------------------------

  const handleDragEnd = (result: {
    source: any;
    destination: any;
    type: any;
  }) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (type === "COLUMN") {
      const reorderedColumns = Array.from(columns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);
      setColumns(reorderedColumns); // This will update both state and localStorage
    } else {
      const reorderedRows = Array.from(rows);
      const [movedRow] = reorderedRows.splice(source.index, 1);
      reorderedRows.splice(destination.index, 0, movedRow);
      setRows(reorderedRows); // This will update both state and localStorage
    }
  };

  // //------------------------------------------------------------------------------
  // //======================== table Cells handle  ================================
  // //------------------------------------------------------------------------------

  const renderInputField = (
    row: Row,
    col: Column,
    rowIndex: number,
    colIndex: number
  ) => {
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      if (
        editingCell &&
        editingCell.rowIndex === rowIndex &&
        editingCell.colIndex === colIndex
      ) {
        switch (e.key) {
          case "Enter":
            handleBlur();
            e.preventDefault();
            if (rowIndex + 1 < rows.length) {
              setEditingCell({ rowIndex: rowIndex + 1, colIndex });
            }
            break;
          case "Tab":
            e.preventDefault();
            const isShift = e.shiftKey;
            const nextColIndex = colIndex + (isShift ? -1 : 1);
            let nextRowIndex = rowIndex;

            if (isShift) {
              if (colIndex > 0) {
                setEditingCell({ rowIndex, colIndex: nextColIndex });
              } else if (rowIndex > 0) {
                nextRowIndex--;
                setEditingCell({
                  rowIndex: nextRowIndex,
                  colIndex: columns.length - 1,
                });
              }
            } else {
              if (nextColIndex < columns.length) {
                setEditingCell({ rowIndex, colIndex: nextColIndex });
              } else {
                nextRowIndex++;
                setEditingCell({ rowIndex: nextRowIndex, colIndex: 0 });
              }
            }
            break;
          case "ArrowDown":
            e.preventDefault();
            if (rowIndex + 1 < rows.length) {
              setEditingCell({ rowIndex: rowIndex + 1, colIndex });
            }
            break;
          case "ArrowUp":
            e.preventDefault();
            if (rowIndex > 0) {
              setEditingCell({ rowIndex: rowIndex - 1, colIndex });
            }
            break;
          default:
            break;
        }
      } else {
        e.preventDefault();
      }
    };

    const handleCellClick = () => {
      if (!isEditing) {
        setEditingCell({ rowIndex, colIndex });
      }
    };

    const handleBlur = () => {
      setEditingCell(null);
    };

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const value = e.target.value;
      setRows((prevRows) =>
        prevRows.map((r, i) =>
          i === rowIndex ? { ...r, [col.name]: value } : r
        )
      );
    };

    if (isEditing) {
      if (col.dataType === "date") {
        return (
          <DateInput
            value={row[col.name]}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        );
      } else if (col.dataType === "number") {
        return (
          <NumberInput
            value={row[col.name]}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        );
      } else if (col.dataType === "cnic") {
        return (
          <CnicInput
            value={row[col.name]}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        );
      }
      return (
        <Input
          className={styles.PopupInput}
          value={row[col.name] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          variant="flushed"
          autoFocus
          bg={colorMode === "light" ? "white" : "#191919"}
          boxShadow={
            colorMode === "light"
              ? "-1px 0px 20px 0px rgb(158, 158, 158)"
              : "none"
          }
          sx={{
            boxShadow:
              colorMode === "light"
                ? "-1px 0px 20px 0px rgb(158, 158, 158)!important"
                : "-1px 0px 20px 0px rgb(40, 40, 40)!important",
          }}
        />
      );
    }

    if (col.dataType === "phone") {
      return (
        <PhonePopover
          key={rowIndex}
          rowIndex={rowIndex}
          col={{ name: "phone" }}
          row={row}
        />
      );
    }
    if (col.dataType === "email") {
      return (
        <EmailPopover
          key={rowIndex}
          rowIndex={rowIndex}
          col={{ name: "email" }}
          row={row}
        />
      );
    }
    if (col.dataType === "status") {
      return (
        <StatusPopover
          key={rowIndex}
          rowIndex={rowIndex}
          col={{ name: "email" }}
          row={row}
        />
      );
    }

    if (col.dataType === "select") {
      return (
        <SelectPopover
          key={rowIndex}
          row={row}
          col={{ name: "select" }} // Set column name accordingly
          handleChange={handleChange}
          selectOptions={selectOptions}
          setSelectOptions={setSelectOptions}
        />
      );
    }
    if (col.dataType === "tags") {
      return (
        <MultiSelect
          rowIndex={rowIndex}
          col={{ name: "tags" }}
          row={row}
          rows={rows}
          setRows={setRows}
          tagsOptions={tagsOptions}
          setTagsOptions={setTagsOptions}
        />
      );
    }
    return (
      <div
        onClick={handleCellClick}
        style={{ cursor: "pointer", padding: "7px", backgroundColor: "none" }}
      >
        {row[col.name] || ""}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="main">
        <div
          style={{ overflowX: "auto", marginLeft: "auto", marginRight: "auto" }}
          className="table-container"
          data-theme={colorMode} // Set the theme for dynamic styling
        >
          <Box p={5}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Table className="notion-table">
                <Droppable
                  droppableId="columns"
                  direction="horizontal"
                  type="COLUMN"
                >
                  {(provided) => (
                    <Thead
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      bg={colorMode === "light" ? "white" : "#191919"}
                    >
                      <Tr>
                        <Th
                          borderBottom="0px"
                          justifyContent="flex-end"
                          alignItems="right"
                          position="sticky"
                          top="0"
                          zIndex="2"
                          bg={colorMode === "light" ? "white" : "#191919"}
                        >
                          <Flex
                            justifyContent="flex-end"
                            alignItems="center"
                            width="125px"
                            height="32px"
                            paddingRight={"10.5px"}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                              }}
                            >
                              {selectedRows.size > 0 && (
                                <Text
                                  bg="none"
                                  color="gray.300"
                                  cursor="pointer"
                                  width={"15px"}
                                  onClick={handleDeleteSelectedRows}
                                >
                                  <MdDelete
                                    color="gray.300"
                                    style={{ width: "20px", height: "20px" }}
                                  />
                                </Text>
                              )}
                              {selectedRows.size > 0 && (
                                <input
                                  style={{ width: "15px", height: "15px" }}
                                  type="checkbox"
                                  onChange={() => {
                                    handleSelectAllRows();
                                  }}
                                />
                              )}
                            </div>
                          </Flex>
                        </Th>
                        {columns.map((col, index) => (
                          <Draggable
                            key={col.name}
                            draggableId={col.name}
                            index={index}
                          >
                            {(provided) => (
                              <Th
                                key={index}
                                borderColor="gray.200"
                                width={col.width}
                                textColor="gray.400"
                                position="sticky"
                                top="0"
                                zIndex="2"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style, // Ensures proper drag styles
                                }}
                                bg={colorMode === "light" ? "white" : "#191919"}
                              >
                                <ColumnPropertyEdit
                                  key={index}
                                  col={col}
                                  index={index}
                                  handleChangeColumnName={
                                    handleChangeColumnName
                                  }
                                  columns={columns}
                                  setColumns={setColumns}
                                  sortColumn={sortColumn}
                                  handleDeleteColumn={handleDeleteColumn}
                                  handleMouseDown={handleMouseDown}
                                />
                              </Th>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        <Th
                          borderBottom={"none"}
                          position="sticky"
                          top="0"
                          zIndex="2"
                          bg={colorMode === "light" ? "white" : "#191919"}
                        >
                          <AddNewColumn
                            onOpen={() => setIsOpen(true)}
                            isOpen={isOpen}
                            onClose={() => setIsOpen(false)}
                            handleAddColumn={handleAddColumn}
                          />
                        </Th>
                        {/* Add background color none to the placeholder */}
                      </Tr>
                    </Thead>
                  )}
                </Droppable>

                <Droppable droppableId="rows" type="ROW">
                  {(provided) => (
                    <Tbody ref={provided.innerRef} {...provided.droppableProps}>
                      {rows.map((row, rowIndex) => (
                        <Draggable
                          key={row.id}
                          draggableId={rowIndex.toString()}
                          index={rowIndex}
                        >
                          {(provided) => (
                            <Tr
                              key={rowIndex}
                              onMouseEnter={() => setHoveredRowIndex(rowIndex)}
                              onMouseLeave={() => setHoveredRowIndex(null)}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style, // Ensures proper drag styles
                              }}
                            >
                              <Td
                                borderBottom="0px"
                                width="125px"
                                height="32px"
                                {...provided.dragHandleProps}
                              >
                                <RowActions
                                  rowIndex={rowIndex}
                                  selectedRows={selectedRows}
                                  hoveredRowIndex={hoveredRowIndex}
                                  handleDeleteRow={handleDeleteRow}
                                  handleAddRowUnder={handleAddRowUnder}
                                  handleSelectRow={handleSelectRow}
                                  setHoveredRowIndex={setHoveredRowIndex}
                                />
                              </Td>

                              {columns.map((col, colIndex) => (
                                <Td
                                  key={colIndex}
                                  borderRight="1px"
                                  borderTop="1px"
                                  borderColor="gray.200"
                                  width="199px"
                                  height="32px"
                                  fontWeight="medium"
                                >
                                  {renderInputField(
                                    row,
                                    col,
                                    rowIndex,
                                    colIndex
                                  )}
                                </Td>
                              ))}
                              <Td borderTop="1px" borderColor="gray.200"></Td>
                            </Tr>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      <Tr>
                        <Td borderBottom="0px" borderTop="0px"></Td>
                        <div style={{ position: "sticky", left: 0, zIndex: 2 }}>
                          <Box>
                            <Button
                              leftIcon={<FaPlus />}
                              onClick={handleAddRow}
                              colorScheme="gray"
                              bg="none"
                              fontWeight="normal"
                              borderRadius={0}
                              borderColor="gray.200"
                              justifyContent="left"
                              textColor="gray.400"
                              textAlign="left"
                            >
                              Add Row
                            </Button>
                          </Box>
                        </div>
                      </Tr>
                      <Tr>
                        <Td borderBottom="0px" borderTop="0px"></Td>
                        {columns.map((_, colmIndex) => (
                          <Td
                            key={colmIndex}
                            borderBottom="0px"
                            borderTop="1px"
                            borderColor="gray.200"
                          >
                            <Box
                              fontWeight="normal"
                              textAlign="right"
                              textColor="gray.400"
                              display="flex"
                              justifyContent="end"
                              alignContent="center"
                            >
                              <p
                                style={{
                                  marginRight: "5px",
                                  fontSize: "10px",
                                  alignItems: "center",
                                }}
                              >
                                COUNT
                              </p>
                              {rows.length}
                            </Box>
                          </Td>
                        ))}
                        <Td
                          borderBottom="0px"
                          borderTop="1px"
                          borderColor="gray.200"
                        ></Td>
                      </Tr>
                    </Tbody>
                  )}
                </Droppable>
              </Table>
            </DragDropContext>
          </Box>
        </div>
      </div>
    </>
  );
};

export default NotionTable;
