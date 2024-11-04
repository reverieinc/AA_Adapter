# Loan Consent Bot

## Objective
The purpose of this bot is to obtain consent from customers to access their bank account details, allowing for a comprehensive assessment of their credit health. This process aids customers in understanding their credit history and current profile, particularly for those who have applied for a loan.

## IVR Call Flow

### 1. Greeting
**Bot:** “Hello, I’m calling to assist you with your loan application process. This call is specifically about obtaining your consent to access your bank account details for credit evaluation. Is this a good time to proceed?”

### 2. Consent Timing
**User:** “Yes, I have a moment.”  
**Bot:** “Great! Thank you.”

### 3. Privacy Policy & Ask for Consent
**Bot:** “Before we move forward, I want to assure you that all data we access from your bank account will be handled according to our privacy policy. Do I have your consent to proceed with accessing your bank account information for this purpose?”

**User:** “Yes, I consent.”  
**Bot:** “Thank you for your consent.”

### 4. Account Selection
**Bot:** “I see you have two accounts registered with us: one from HDFC ending in 8976 and another from Axis Bank ending in 2345. Which account would you like to provide consent for? Sharing data from both accounts may enhance your chances of loan approval.”

**User:** “I’d like to proceed with the HDFC account.”  
**Bot:** “Understood. We will proceed with the HDFC account ending in 8976.”

### 5. Scope of Consent
**Bot:** “Thank you for confirming your HDFC account. For this account, we will have access to the following information for the next six months:
- (a) Credit transactions over ₹10,000
- (b) Current balance
- (c) Transaction history
- (d) Profile information  
Do you understand and agree to this scope of consent?”

**User:** “Yes, I understand and agree.”  
**Bot:** “Thank you for confirming.”

### 6. OTP Request
**Bot:** “To complete the consent process, you will receive an OTP from HDFC shortly. Please share this OTP with your dedicated relationship manager to authorize access to your account information. This is essential to move forward with your loan application.”

**User:** “Okay, I will do that.”  
**Bot:** “Thank you for your cooperation.”

### 7. Closing
**Bot:** “Thank you for your time today. If you have any further questions or need assistance, please don’t hesitate to reach out to our customer care number. Have a great day!”

**User:** “Thank you! Goodbye.”  
**Bot:** “Goodbye!”

---

## Integration with Sahamati Network

Sahamati provides specifications for Account Aggregators (AAs), Financial Information Users (FIUs), and Financial Information Providers (FIPs) to work together, ensuring compliance with RBI guidelines on data and security. The integration involves a partnership with another AA, **Saafe.in**, which will support the backend services necessary for this consent journey.

### Participating Entities
- **FIU:** Triggers consent to AA (Reverie + Saafe) and receives customer feedback (Accepted or Rejected).
- **AA Backend (Saafe APIs):** Participates in the network and interacts with other AA participants, serving as the backend for the call flow.
- **IndoCord Voice Bot:** Drives the consent conversation with the end user, requiring dynamic data during the call.
- **Reverie AA Adapter:** Acts as a glue between IndoCord and the AA Backend, handling frontend and backend needs.

### Sequence Diagram
The control flow between participants is as follows:

| No. | From | To | Action |
|-----|------|----|--------|
| 1   | FIU  | AA Backend | A Consent Request is triggered by the end user, creating consent on the backend. A redirect_url is returned. |
| 2   | FIU  | AA Adapter Frontend | User journey shifts to AA Adapter Frontend, which loads background calls to retrieve user data. |
| 3   | AA Adapter Frontend | IndoCord | Trigger a call using the phone number and PIN. |
| 4   | IndoCord | AA Adapter Backend | IndoCord triggers APIs on the AA Adapter backend to receive dynamic information during the call. |
| 5   | AA Backend | FIU | Consent answer is sent back to FIU. |
| 6   | AA Adapter Frontend | FIU | Redirect the user to the FIU page. |

### AA Backend API Flow

To trigger the consent request from the FIU Docker instance:
- **POST** `v2/consents/requests` (with sample consent parameters and consentHandle)
  - Response includes `ecreq` (Encrypted request code), `fi`, and `reqdate`.

During the voice bot flow, the following Saafe Backend APIs are triggered:

1. **To get linked accounts:**
   - **GET** `decode` (inputs: `ecreq`, `fi`, `reqdate`)
   - Response includes the phone number and `SRCREF`.

2. **To get consent parameters:**
   - **POST** `v2/User/Consent/handle` (input: `consent_handle=SRCREF`, `access_token`)
   - Receives all consent-related parameters.

3. **To send consent approval or rejection:**
   - **POST** `User/Consents/Approval/Verification` (inputs: `consent_handle=SRCREF`, `linkedRefNumber`, `fipHandle`, `access_token`, `consentApprovalStatus=READY/FAILED`).

## Conclusion
This Loan Consent Bot streamlines the consent process for customers, enhancing their loan application experience while ensuring compliance with regulatory standards.
