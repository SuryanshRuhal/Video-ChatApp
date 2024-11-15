import React, { useCallback, useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import timage1 from "./t4.jpg";
import './styles.css';
import { useSocket } from "../contextprovider/socketprovider";

function Lobby(){

    const [contact,Setcontact]= useState({
        email:"",
        room:"",
    });
    
    const socket = useSocket();
    const Navigate= useNavigate();

    const handleSubmitform = useCallback(
        (e)=>{
            e.preventDefault();
            socket.emit(`room:join`,{contact});
        }, [contact,socket]
    );

    const handlejoinroom=useCallback((data)=>{
        const {contact}=data;
        Navigate(`/room/${contact.room}`)
    },[]);
    // listen to socket event room:join and return handlejoinroom callback function
    useEffect(()=>{
        socket.on("room:join", handlejoinroom);
        return ()=>{
            socket.off("room:join",handlejoinroom);
        }
    },[handlejoinroom,socket]);
    
    function changeto(event){
        const {name, value}= event.target;
        Setcontact(prevValue =>{
        return{
            ...prevValue,
            [name]: value,
           };
        });
    }

return ( 
    <>
   <section className="lgpage " >
   <div className="lcontainer">
    <div className="ic">
    <img src={timage1} alt="image" className="timage" />
    </div>
<div className="lgcontainer">
      <h1>
      Welcome
    </h1>
    <form className="lgform" onSubmit={handleSubmitform}>
        <input className="tl"name="email" value={contact.email} placeholder="Enter your Email" onChange={changeto}/>  
        <div>
        <input className="tl"name="room"  type= 'text' value={contact.room} placeholder="Room No." onChange={changeto}/>
        </div>
        <button className="button">JOIN</button>
    </form>
</div>

</div>
</section>
</>
);
}


export default Lobby ;