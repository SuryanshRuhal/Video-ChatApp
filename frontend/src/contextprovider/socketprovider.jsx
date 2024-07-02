import React,{createContext, useMemo,useContext} from "react";
import {io} from "socket.io-client";
const Socketcontext= createContext(null);

export const useSocket=()=>{
    const socket= useContext(Socketcontext);
    return socket;
}
export const SocketProvider=(props)=>{
    const socket= useMemo(()=>io("http://localhost:8000"),[]);
    return (
        <Socketcontext.Provider value={socket}>
            {props.children}
        </Socketcontext.Provider>
    )
}