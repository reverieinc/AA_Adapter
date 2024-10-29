"use client"

import { Button, Checkbox, Input, message, Typography } from "antd";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [mobile, setMobile] = useState('');
  const [fiList, setFiList] = useState([]);
  const [fiuEntity, setFiuEntity] = useState('rev-fiu');
  let router = useRouter();

  let fiTypeList = [
    "DEPOSIT",
    "RECURRING_DEPOSIT",
    "SIP",
    "CP",
    "GOVT_SECURITIES",
    "EQUITIES",
    "BONDS",
    "DEBENTURES",
    "MUTUAL_FUNDS",
    "ETF",
    "IDR",
    "CIS",
    "AIF",
    "INSURANCE_POLICIES",
    "NPS",
    "INVIT",
    "REIT",
    "OTHER",
    "GENERAL_INSURANCE",
    "GSTR1_3B",
    "TERM_DEPOSIT",
    "TERM_DEPOSIT"
  ];

  const handleAddToFIList = (e, fiType) => {
    if (e) {
      if (!fiList.includes(fiType)) {
        setFiList((prev) => {
          return [...prev, fiType];
        })

      }

    }
    else {
      if (fiList.includes(fiType)) {
        setFiList((prev) => {
          return prev.filter((item) => item !== fiType);
        })

      }

    }

  }

  const handleGetConsent = async () => {
    if (mobile.length !== 10) {
      message.warning("Enter valid mobie number");
      return;

    }
    if (fiList.length === 0) {
      message.warning("Select at least one FI type");
      return;

    }

    if (fiuEntity.length === 0) {
      message.warning("Enter FIU Entity");
      return;

    }

    let data = JSON.stringify({
      "redirect_params": {
        "callback_url": "https://bootstack.xyz"
      },
      fiList,
      mobile

    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${process.env.NEXT_PUBLIC_AA_ADAPTER_URL}/auth`,
      headers: {
        'fiu_entity_id': fiuEntity,
        'aa_entity_id': 'saafe-sandbox',
        'Content-Type': 'application/json',
        'Authorization': 'Basic YWlfMjhYUGs5Q0x4QVNtZTJWc2s2cHluNlJ0dHBkeE4yRGU6YXNfaGZkMlJKc0R1ejNRaU1xeWlMODVKZ0xVeDhQSzZIRGY='
      },
      data
    };

    axios.request(config)
      .then((response) => {
        let res = ((response.data));
        let redirectUrl = res.redirect_url;
        let token = redirectUrl.split('?')[1];
        let proxyRedirect = `/webview?client_handle=saafe_aa&${token}`;
        router.push(proxyRedirect);

      })
      .catch((error) => {
        console.log(error.message);
      });

  }

  return (
    <div className={styles.page}>
      <Typography.Title level={2}>FIU Consent Request Generator</Typography.Title>
      <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Enter Registered Mobile Number" />
      <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-start",alignItems:"flex-start",gap:"14px"}}>
        <Typography.Title level={3}>User Consent Progress</Typography.Title>
        <div className={styles.gridContainer}>
          {
            fiTypeList.map((fiType, index) => (
              <Checkbox
                key={index}
                value={fiType}
                onChange={(e) => {
                  handleAddToFIList(e, fiType)
                }}
              >
                {fiType}

              </Checkbox>

            ))
          }
        </div>
        <Button type="primary" onClick={handleGetConsent}>Send Consent</Button>
      </div>

    </div>
  );
}
