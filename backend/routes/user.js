const express = require("express");
const { getSession, updateSessionAccessToken } = require("../getSession");
const { sessionCollection } = require("../db");
const { default: axios } = require("axios");
const router = express.Router();

let bankNames = [
  "IDFC BANK",
  "STATE BANK OF INDIA",
  "HDFC BANK",
  "ICICI BANK",
  "FEDERAL BANK",
];

router.get("/", function (req, res) {
  res.json({ message: "Welcome to the User API!" });
});

async function linkedaccount(session, fipId, fiArr) {
    let accountsArr = []
    for(let account of fiArr){
        account.maskedAccNumber = "XXXXXXXXXXXXXXXX"+account.last4digits;
        accountsArr.push(account);

    }
  let returnData;
  let data = JSON.stringify({
    FipId: fipId,
    Accounts: accountsArr,
    signature: session.signature,
  });

  console.log(data);

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://test.saafe.in/api/v2/User/account/link",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.accessToken,
      Cookie: "OAuth_Token_Request_State=fa03ed19-50f3-416c-bceb-c22e51b5cc0b",
    },
    data: data,
  };

  await axios
    .request(config)
    .then((response) => {
      console.log(response.data);
      returnData = response.data;
    })
    .catch((error) => {
      console.log(error.message);
    });

  return returnData; 
}

async function verifyOTP(RefNumber, fipId, session) {
  let returnResp;

  let data = JSON.stringify({
    RefNumber,
    token: "OTP received from the FIP",
    fipId,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://test.saafe.in/api/v2/User/account/link/verify",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.accessToken,
      Cookie: "OAuth_Token_Request_State=fa03ed19-50f3-416c-bceb-c22e51b5cc0b",
    },
    data: data,
  };

  await axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
      returnResp = response.data;
    })
    .catch((error) => {
      console.log(error);
    });

  return returnResp;
}

router.post("/account/verify", async (req, res) => {
  let body = req.body;
  let { accounts } = body;
  if (!accounts) {
    res.status(400).json({
      message: "No accounts given",
    });
    return;
  }
  let sessionId = req.headers?.session_id;
  let session = await sessionCollection.findOne({ sessionId });
  let fipId = req.headers?.fip_handle;

  let response = await linkedaccount(session, fipId, accounts);
  console.log(response);
  if(!response){
    res.status(400).json({message:"Unserviceable right now"});
  }
  let { refNumber } = response;
  if (!refNumber) {
    res.status(400).json({
      message: "Not Linked",
    });
    return;
  }
  let verifyResponse = await verifyOTP(refNumber, fipId, session);
  console.log(verifyResponse);

  res.status(200).json({ message: "success" });
  return;
});

router.get("/accounts", async function (req, res) {
  res.status(200).json([
    {
      fipHandle: "IGNOSIS_FIP_SANDBOX",
      name: "Ignosis Bank",
    },
    {
      fipHandle: "setu-fip",
      name: "HDFC Bank",
    },
    {
      fipHandle: "setu-fip-2",
      name: "ICICI Bank",
    },
  ]);
});

async function discoverAccounts(token, fiTypes, fipHandle, mobile) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", token);
  myHeaders.append(
    "Cookie",
    "OAuth_Token_Request_State=fa03ed19-50f3-416c-bceb-c22e51b5cc0b"
  );
  const raw = JSON.stringify({
    FipId: fipHandle,
    Identifiers: [
      {
        type: "MOBILE",
        value: mobile,
        categoryType: "STRONG",
      },
    ],
    FITypes: fiTypes,
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  let responseObj;

  await fetch(
    "https://test.saafe.in/api/v2/User/account/discovery",
    requestOptions
  )
    .then((response) => {
      return response.json();
    })
    .then((res) => {
      responseObj = res;
    })
    .catch((error) => console.error(error));

  return responseObj;
}

router.get("/linkedaccount", async function (req, res) {
  try {
    let sessionId = req.headers?.session_id;
    let fipHandleId = req.headers?.fip_handle;

    if (!sessionId) {
      res.status(401).json({ status: "ERROR", message: "Missing session_id" });
      return;
    }
    let accounts = [];
    let session = await getSession(sessionId);
    console.log(session.phone);
    let fiTypes = session.fiTypes;

    if (session) {
      let { accessToken, consentHandle, ivrSessionEnd } = session;
      if (ivrSessionEnd < Date.now()) {
        await sessionCollection.deleteOne({ sessionId: session.sessionId });
        res.status(401).json({ status: "ERROR", message: "Session expired" });
        return;
      } else {
        let token = "Bearer " + accessToken;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", token);

        const requestOptions = {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        };
        fetch(
          `${session.baseUrl}/User/linkedaccount?consentHandle=${consentHandle}`,
          requestOptions
        )
          .then((response) => {
            if (!response.ok) {
              res.status(response.status).json({
                status: "ERROR",
                message: "Failed to fetch linked accounts",
              });
              return;
            }
            return response.json();
          })
          .then(async (result) => {
            if (!result) {
              return;
            }
            result.forEach((account) => {
              let {
                fiType,
                fipHandle,
                fipName,
                linkRefNumber,
                maskedAccNumber,
              } = account;
              if (fiTypes.includes(fiType) && fipHandle === fipHandleId)
                accounts.push({
                  accountType: fiType,
                  linkRefNumber,
                  last4digits: maskedAccNumber.slice(
                    maskedAccNumber.length - 4
                  ),
                  alreadyRegistered: true,
                });
            });
            let resp = await discoverAccounts(
              token,
              fiTypes,
              fipHandleId,
              session.phone
            );
            let accountArr = resp.DiscoveredAccounts;
            accountArr.forEach((acc) => {
              let { FIType, accRefNumber, maskedAccNumber } = acc;
              if (fiTypes.includes(FIType)) {
                accounts.push({
                  accountType: FIType,
                  linkRefNumber: accRefNumber,
                  last4digits: maskedAccNumber.slice(
                    maskedAccNumber.length - 4
                  ),
                  alreadyRegistered: false,
                });
              }
            });

            session.signature = resp.signature;
            session.step = 5;
            await sessionCollection.updateOne({ sessionId }, { $set: session });
            res.status(200).json(accounts);
          })
          .catch((error) => {
            console.error("Error:", error.message);
            res
              .status(500)
              .json({ status: "ERROR", message: "Internal Server Error" });
            return;
          });
      }
    } else {
      res.status(401).json({ status: "ERROR", message: "Session not found" });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
    return;
  }
});

router.get("/Consent/handle", async function (req, res) {
  try {
    let sessionId = req.headers?.session_id;
    if (!sessionId) {
      res.status(401).json({ status: "ERROR", message: "Missing session_id" });
      return;
    }
    let session = await getSession(sessionId);
    if (session) {
      let { accessToken, consentHandle, ivrSessionEnd } = session;
      if (ivrSessionEnd < Date.now()) {
        await sessionCollection.deleteOne({ sessionId: session.sessionId });
        res.status(401).json({ status: "ERROR", message: "Session expired" });
        return;
      } else {
        let token = "Bearer " + accessToken;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", token);
        myHeaders.append(
          "Cookie",
          "null; KC_REDIRECT=/api/v2/User/linkedaccount"
        );

        const requestOptions = {
          method: "GET",
          headers: myHeaders,
          redirect: "follow",
        };
        fetch(
          `${session.baseUrl}/User/Consent/handle?consentHandle=${consentHandle}`,
          requestOptions
        )
          .then((response) => {
            if (!response.ok) {
              res.status(response.status).json({
                status: "ERROR",
                message: "Failed to fetch linked accounts",
              });
              return;
            }
            return response.json();
          })
          .then(async (result) => {
            if (!result) {
              return;
            }
            // if (!result["fiTypes"]) {
            //   res.status(400).json({
            //     status: "ERROR",
            //     message: "Failed to fetch fiTypes from Consent",
            //   });
            //   return;
            // }
            // session.fiTypes = result["fiTypes"];
            session.step = 4;
            await sessionCollection.updateOne({ sessionId }, { $set: session });

            res.status(200).json(result);
          })
          .catch((error) => {
            console.error("Error:", error.message);
            res
              .status(500)
              .json({ status: "ERROR", message: "Internal Server Error" });
            return;
          });
      }
    } else {
      res.status(401).json({ status: "ERROR", message: "Session not found" });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
    return;
  }
});

router.post("/Consents/Approval/Verification", async function (req, res) {
  try {
    let sessionId = req.headers?.session_id;
    let status = req.body?.status;
    let accounts = req.body?.accounts;

    if (!status || !accounts) {
      res
        .status(400)
        .json({ status: "ERROR", message: "Missing required parameters" });
      return;
    }

    if (!sessionId) {
      res.status(401).json({ status: "ERROR", message: "Missing session_id" });
      return;
    }
    let session = await getSession(sessionId);
    if (session) {
      let { accessToken, consentHandle, ivrSessionEnd } = session;
      if (ivrSessionEnd < Date.now()) {
        await sessionCollection.deleteOne({ sessionId: session.sessionId });
        res.status(401).json({ status: "ERROR", message: "Session expired" });
        return;
      } else {
        let token = "Bearer " + accessToken;

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", token);
        myHeaders.append(
          "Cookie",
          "null; KC_REDIRECT=/api/v2/User/linkedaccount"
        );

        const raw = JSON.stringify({
          consentHandle: [consentHandle],
          constentApprovalStatus: status,
          accounts,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
          redirect: "follow",
        };

        fetch(
          `${session.baseUrl}/User/Consents/Approval/Verification`,
          requestOptions
        )
          .then((response) => {
            console.log(response)
            return response.json();
          })
          .then(async (result) => {
            console.log(result);
            if (!result) {
              return;
            }
            if (result[0]?.ConsentStatus === "FAILED") {
              session.step = 7;
            } else {
              session.step = 6;
            }

            await sessionCollection.updateOne({ sessionId }, { $set: session });
            res.status(200).json(result);
          })
          .catch((error) => {
            console.error("Error:", error.message);
            res
              .status(500)
              .json({ status: "ERROR", message: "Internal Server Error" });
            return;
          });
      }
    } else {
      res.status(401).json({ status: "ERROR", message: "Session not found" });
      return;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "ERROR", message: "Internal Server Error" });
    return;
  }
});

router.post("/init-otp", async (req, res) => {
  try {
    let phoneNumber = req.body?.phoneNumber;
    let sessionId = req.headers.session_id;

    if (!sessionId || !phoneNumber) {
      res
        .status(400)
        .json({ status: "ERROR", message: "Missing required parameters" });
      return;
    }

    let session = await getSession(sessionId);

    if (session) {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append(
        "Cookie",
        "null; null; null; KC_REDIRECT=/api/v2/User/linkedaccount"
      );

      const raw = JSON.stringify({
        phoneNumber,
        isTermsAndConditionAgreed: true,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(`${session.baseUrl}/public/user/combined/init-otp`, requestOptions)
        .then(async (response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            res
              .status(400)
              .json({ status: "ERROR", message: "Failed to send OTP" });
            return;
          }
        })
        .then(async (result) => {
          //step to 1
          session.step = 2;
          await sessionCollection.updateOne({ sessionId }, { $set: session });
          res.status(200).json({
            status: "OK",
            message: "OTP sent successfully",
            otpUniqueID: result.otpUniqueID,
          });
          return;
        })
        .catch((error) => {
          console.error("Error:", error.message);
          res
            .status(500)
            .json({ status: "ERROR", message: "Internal Server Error" });
          return;
        });
    } else {
      res
        .status(401)
        .json({ status: "ERROR", message: "Invalid client handle" });
      return;
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "ERROR", message: "Failed to initiate OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    let phoneNumber = req.body?.phoneNumber;
    let otp = req.body?.otp;
    let otpUniqueID = req.body?.otpUniqueID;
    let sessionId = req.headers.session_id;

    if (!sessionId || !phoneNumber || !otpUniqueID || !otp) {
      res
        .status(400)
        .json({ status: "ERROR", message: "Missing required parameters" });
      return;
    }

    let session = await getSession(sessionId);

    if (session) {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append(
        "Cookie",
        "null; null; null; KC_REDIRECT=/api/v2/User/linkedaccount"
      );

      const raw = JSON.stringify({
        code: otp,
        phoneNumber,
        otpUniqueID,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      fetch(
        `${session.baseUrl}/public/user/combined/verify-otp`,
        requestOptions
      )
        .then(async (response) => {
          if (response.status === 200) {
            return response.json();
          } else {
            res
              .status(400)
              .json({ status: "ERROR", message: "Failed to send OTP" });
            return;
          }
        })
        .then(async (result) => {
          if (!result) {
            return;
          }
          let { firstName, lastName, vuaId, phoneNumber, access_token } =
            result;
          session = await updateSessionAccessToken(sessionId, access_token);
          session.step = 3;
          await sessionCollection.updateOne({ sessionId }, { $set: session });
          res.status(200).json({
            firstName,
            lastName,
            userid: vuaId,
            phoneNumber,
          });
          return;
        })
        .catch((error) => {
          console.error("Error:", error.message);
          res
            .status(500)
            .json({ status: "ERROR", message: "Internal Server Error" });
          return;
        });
    } else {
      res
        .status(401)
        .json({ status: "ERROR", message: "Invalid client handle" });
      return;
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "ERROR", message: "Failed to initiate OTP" });
  }
});

module.exports = router;
