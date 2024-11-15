import React, { useCallback, useEffect,useState } from "react";
import { useSocket } from "../contextprovider/socketprovider";
import DuoIcon from '@mui/icons-material/Duo';
import ReactPlayer from "react-player";
import Draggable from 'react-draggable'
import peer from "../service/peer";
function Room(){
    const  socket= useSocket();
    const [myStream, setMyStream]= useState();
    const [calling,setcalling]= useState(false);
    const [caller,setcaller]= useState(false);
    const[remoteStream,setRemoteStream]= useState(null);
    const [remotesocketid, setremotesocketid]= useState();
    
    const handleUserJoined= useCallback(({contact, id})=>{
        console.log(`Email ${contact.email} joined room`);
        setremotesocketid(id);
    }, []);

    const handleCallUser= useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
             video: true,
        });
        
        const offer= await peer.getOffer();
        socket.emit("user:call",{
            to: remotesocketid, offer
        })
        setMyStream(stream);
    },[remotesocketid, socket]);

    const handleIncomingCall= useCallback(async({from, offer})=>{
        setremotesocketid(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
             video: true,
        });
        setMyStream(stream);
        console.log(`Incoming Call`, from, offer);
        const ans= await peer.getAnswer(offer);
        socket.emit("call:accepted",{to: from,ans})
    },[socket]);

    const sendStreams = useCallback(() => {
        setcaller()
        for (const track of myStream.getTracks()) {
          peer.peer.addTrack(track, myStream);
        }
      }, [myStream]);

    const handleCallAccepted= useCallback(({from, ans})=>{
        peer.setLocalDescription(ans);
        console.log("Call Accepted");
        setcalling(true);
        sendStreams();
    },[sendStreams]);

    const handleNegoNeeded= useCallback(async()=>{
        const offer= await peer.getOffer();
            socket.emit("peer:nego:needed",{ offer, to: remotesocketid})
    },[remotesocketid,socket]);

    useEffect(()=>{
        peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
        return ()=>{
            peer.peer.removeEventListener("negotiationneeded",handleNegoNeeded);
        };
    },[handleNegoNeeded]);

    const handleNegoNeededIncoming= useCallback(async({from, offer})=>{
        const ans= await peer.getAnswer(offer);
        socket.emit('peer:nego:done',{to: from,ans});
    },[socket]);
    
    const handleNegoNeededFinal= useCallback(async ({ans})=>{
        await peer.setLocalDescription(ans);
    },[]);

    useEffect(()=>{
        peer.peer.addEventListener("track", async (ev)=>{
            setcalling(true);
            setcaller(true);
            const remoteStream=  ev.streams;
            setRemoteStream(remoteStream[0]);
        });
    },[]);

    useEffect(()=>{
        socket.on('user:joined', handleUserJoined);
        socket.on("incoming:call", handleIncomingCall);
        socket.on("call:accepted",handleCallAccepted);
        socket.on("peer:nego:needed",handleNegoNeededIncoming);
        socket.on("peer:nego:final",handleNegoNeededFinal);
        return()=>{
            socket.off("user:joined",handleUserJoined);
            socket.off("incoming:call", handleIncomingCall);
            socket.off("call:accepted",handleCallAccepted);
            socket.off("peer:nego:needed",handleNegoNeededIncoming);
            socket.off("peer:nego:final",handleNegoNeededFinal);
        }
    },[socket, handleUserJoined,handleIncomingCall,handleNegoNeededFinal,handleCallAccepted,handleNegoNeededIncoming]);
    return(
        <div className="roompage">
         {(!calling)?<>
         <h2 className="heading"> Room </h2>
         <h4 className="subheading">{remotesocketid? "Connected" : "Currently, None is present in the room "}</h4>
        {remotesocketid && <DuoIcon className="iconv" onClick={handleCallUser}/>}
        </>:<>
        {myStream && <button className="roombtn" onClick={sendStreams}>{caller?"Answer":""}</button>}
        { myStream && (
            <>
             <Draggable>
               <ReactPlayer className="myvideo" playing url={myStream}/>
             </Draggable>
        </>)}
        { remoteStream && (
            <>
        <ReactPlayer className="yourvideo" playing  url={remoteStream}/>
        </>)}
        </>}
        </div>
    ); 
}
export default Room;