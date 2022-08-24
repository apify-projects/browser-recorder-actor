import React, { FC, useState } from 'react';
import { InterpretationButtons } from "./InterpretationButtons";
import { AddButton } from "../atoms/buttons/AddButton";
import { GenericModal } from "../atoms/GenericModal";
import { PairEditForm } from "./PairEditForm";
import { WhereWhatPair, WorkflowFile } from "@wbr-project/wbr-interpret";
import { AddPair } from "../../api/workflow";
import { Button, Stack } from "@mui/material";
import { FastForward, DoubleArrowOutlined } from "@mui/icons-material";
import { useSocketStore } from "../../context/socket";
import { useGlobalInfoStore } from "../../context/globalInfo";

export const SidePanelHeader = () => {

 const [steppingIsDisabled, setSteppingIsDisabled] = useState(true);
 const [linear, setLinear] = useState(true);

 const { socket } = useSocketStore();

 const handleStep = () => {
   socket?.emit('step');
 };
 
 const handleLinearToggle = () => {
  socket?.emit('linear', !linear);
  setLinear(!linear);
 };

 return (
   <div style={{width: 'inherit'}}>
    <InterpretationButtons enableStepping={(isPaused) => setSteppingIsDisabled(!isPaused)}/>
     <Button
       variant='outlined'
       disabled={steppingIsDisabled}
       onClick={handleStep}
       sx={{marginLeft:'15px'}}
     >
       step
       <FastForward/>
     </Button>
     <Button
       variant= { linear ? 'contained' : 'outlined' }
       onClick={handleLinearToggle}
       sx={{marginLeft:'15px'}}
     >
       Linear
       <DoubleArrowOutlined/>
     </Button>
    <hr/>
   </div>
 );
};
