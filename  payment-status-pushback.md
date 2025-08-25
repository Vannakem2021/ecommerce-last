While reviewing the integration documentation for the Purchase API, I noticed the statement:

“Merchant shall provide a webhook to PayWay integration team to configure on Merchant profile. The URL will be used to post the transaction status.”

I’d like to confirm the following points to ensure our implementation is correct:

Is providing a webhook URL to be configured on our merchant profile mandatory for receiving the payment status after a purchase is completed?

If we do not set a static webhook in the merchant profile, can we rely solely on sending a return_url (base64 encoded) in the Purchase API request to receive pushback notifications for that transaction?

In cases where neither the static webhook nor the dynamic return_url is set, is the Check Transaction API the only way to retrieve the final payment status?

// Payway support reply:
Is providing a webhook URL to be configured on our merchant profile mandatory for receiving the payment status after a purchase is completed?
Yes, it’s mandatory
If we do not set a static webhook in the merchant profile, can we rely solely on sending a return_url (base64 encoded) in the Purchase API request to receive pushback notifications for that transaction?
Yes, you can.
In cases where neither the static webhook nor the dynamic return_url is set, is the Check Transaction API the only way to retrieve the final payment status?
You can use either one of them.
