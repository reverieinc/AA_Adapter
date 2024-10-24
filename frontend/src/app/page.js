"use client"

import { Button, Input, message } from "antd";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
const { TextArea } = Input;
import { CheckCircleTwoTone, LoadingOutlined } from '@ant-design/icons';

export default function Home() {
  const [value, setValue] = useState('');
  const [clientHandle,setClientHandle] = useState('');
  const [buttonDisabled,setButtonDisabled] = useState(false);
  const [sessionId,setSessionId] = useState('');
  const [phone,setPhone] = useState('');
  const [step,setStep] = useState(0);

  const progressSteps = [
    'User Login',
    'OTP Verification',
    'Fetching Linked Accounts',
    'Consent Review',
    'Consent Approval',

  ]
  
  const handleSubmit = async() =>{
    let token = value.split('?')[1];
    let url = process.env.NEXT_PUBLIC_AA_ADAPTER_URL;
    //replace all %3D to =
    token = token.replace(/%3D/g, "=");
    console.log(token,url);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${url}/webview?${token}`,
      headers: { 
        'client_handle': clientHandle
      }
    };


    let res = await axios.request(config)
    if(res.status === 200){
      console.log("Session started")
        let data = res.data;
        let {sessionId,phone,fiuName} = data;
        setButtonDisabled(true);
        setSessionId(sessionId);
        setPhone(phone);

    }
    else{
      message.info("Expired Request")
    }

  }

  const getProgress = async() => {
    console.log("fetching request");
    let url = process.env.NEXT_PUBLIC_AA_ADAPTER_URL;
    let config = {
      method: 'get',
      url: `${url}/progress?sessionId=${sessionId}`,
    };

    let res = await axios.request(config)
    if(res.status === 200){
      setStep(res.data.step);

    }
    else{
      message.error("Failed to fetch progress")
    }
  }

  useEffect(()=>{
    if(sessionId.length === 0){
      return;
    }
    let interval = setInterval(()=>{
      getProgress();

      return ()=>{
        clearInterval(interval);
      }

    },2000)
    
  },[sessionId]);

  return (
    <div className={styles.page}>
      {
        sessionId.length>0 &&
          <div>
            <h2>Session ID : {sessionId}</h2>
            <p>Phone: {phone}</p>

          </div>
      }
      <TextArea
        autoCorrect={false}
        spellCheck={false}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter your redirection URL"
        autoSize={{
          minRows: 5,
          maxRows: 5,
        }}
        style={{
          backgroundColor:"GRAY",
          color:'white'
        }}

      />
      <Input
        value={clientHandle}
        placeholder="Enter client handle"
        onChange={(e)=>setClientHandle(e.target.value)}
        style={{
          backgroundColor:"GRAY",
          color:'white'
        }}
      />
      <Button disabled={buttonDisabled} type="primary" onClick={handleSubmit}>Trigger IVR Call</Button>

      {
        sessionId.length > 0 &&
        <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",alignItems:"flex-start",gap:"10px"}}>
          {
            progressSteps.map((item, index) => {
              console.log(index)
              return (
                <div key={index} style={{display:"flex",flexDirection:"row",justifyContent:"center",alignItems:"center",gap:"10px"}}>
                  <span>{item}</span>
                  {
                    step>=index?step===index?<LoadingOutlined />:<CheckCircleTwoTone twoToneColor="#52c41a" />:<></>
                  }
                  
                </div>
              );
            })
          }
        </div>
      }
      
          {
            step===5 &&
            <div style={{display:"flex",flexDirection:"row",justifyContent:"flex-start",alignItems:"flex-start",gap:"10px"}}>
                  <span>Verification Complete</span>
                  {
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  }
                  
              </div>
          }
        </div>
  );
}
