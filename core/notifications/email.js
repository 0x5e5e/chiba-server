/**
 * Email.js 
 */
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(sails.config.SENDGRID_KEY);

module.exports = {

    signupConfirmation: function(email, code) {
        const verification = sails.config.HOST + '/verification/' + code;
        const msg = {
            to: email,
            from: 'no-reply@chiba.exchange',
            subject: 'Verify your chiba account',
            text: 'Welcome to chiba! Please verify your email address by visiting this link: ' + verification,
            html: '<div style="text-align:center; margin-top: 2em"><span>Welcome to chiba! Please verify your email address by clicking the link below.</span><div style="margin-top: 1em"><a href="' + verification + '"><button style="background-color: #43A047; margin: 10px; padding: 12px 24px; text-align: center; color: #fff; border: 0 none; border-radius: 4px; font-size: 13px; line-height: 1.3; ">VERIFY EMAIL</button></a></div></div>',
        };
        sgMail.send(msg);
    },

    orderComplete: function(email, depositAmount, depositMethod, depositCurrency, credited, difference) {
        const msg = {
            to: email,
            from: 'no-reply@chiba.exchange',
            subject: 'Deposit Completed',
            text: 'Your deposit of $' + depositAmount + " via " + depositMethod + " was successfully completed.  You have been credited $" + credited + ", which is now available in your credit balance.",
            html: '<html><head> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <title>chiba</title></head><body style="height: 100% !important; margin: 0; padding: 0; width: 100% !important;" bgcolor="#F2F5F7"> <table id="main" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0"> <tbody> <tr> <td valign="top" align="center" bgcolor="#3b4a69" style="background: #43A047 0% 0% / cover; padding: 0 15px;"> <table class="innermain" cellpadding="0" width="100%" cellspacing="0" border="0" align="center" style="margin:0 auto; table-layout: fixed; border-collapse: collapse !important; max-width: 600px;"> <tbody> <tr> <td align="center" valign="top" width="100%"> <table class="logo" width="100%" cellpadding="0" cellspacing="0" border="0"> <tbody> <tr> <td align="center" valign="top" style="-ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; padding: 30px 0;"> <img alt="chiba-logo" src="https://s3.amazonaws.com/chiba-branding/logo_white.png" border="0" style="-ms-interpolation-mode: bicubic; border: 0; display: block; height: 20%; line-height: 100%; outline: none; text-decoration: none;"> </td> </tr> </tbody> </table> <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 25px;"> <tbody> <tr> <td height="40"></td> </tr> <tr style="font-family: -apple-system,BlinkMacSystemFont,sans-serif; color:#4E5C6E; font-size:14px; line-height:20px; margin-top:20px;"> <td class="content" colspan="2" valign="top" align="center" style="padding-left:40px; padding-right:40px;"> <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"> <tbody> <tr> <td align="center" valign="bottom" colspan="2" cellpadding="3"> <img alt="check" width="80" src="https://s3.amazonaws.com/chiba-branding/checkmark.png"/> </td> </tr> <tr> <td height="20"  =""></td> </tr> <tr> <td align="center"> <div style="font-size: 22px; line-height: 32px; font-weight: 500; margin-left: 20px; margin-right: 20px; margin-bottom: 25px;"> Your deposit of $' + depositAmount + ' has been completed. </div> </td> </tr> <tr> <td height="24"  =""></td> </tr> <tr> <td height="1" bgcolor="#DAE1E9"></td> </tr> <tr> <td height="24"  =""></td> </tr> <tr> <td> <table style="width: 100%; border-collapse:collapse;"> <tbody style="border: 0; padding: 0; margin-top:20px;"> <tr> <td width="50%" valign="top" style="padding-bottom: 10px; padding-top: 10px;">Deposit method</td> <td style="padding-bottom: 10px; padding-top: 10px;">' + depositMethod.toUpperCase() + ' / ' + depositCurrency.toUpperCase() + '</td> </tr> <tr> <td style="padding-bottom: 10px; padding-top: 10px;">Deposit Amount</td> <td style="padding-bottom: 10px; padding-top: 10px;">$' + depositAmount + '</td> </tr> <tr> <td style="padding-bottom: 10px; padding-top: 10px;">Fees</td> <td style="padding-bottom: 10px; padding-top: 10px;">$' + difference + '</td> </tr> <tr> <td style="padding-bottom: 10px; padding-top: 10px;">Deposit Fee</td> <td style="padding-bottom: 10px; padding-top: 10px;">$0.00</td> </tr> <tr> <td style="padding-bottom: 10px; padding-top: 10px;">Total Credited</td> <td style="padding-bottom: 10px; padding-top: 10px;">$' + credited + '</td> </tr> </tbody> </table> </td> </tr> <tr> <td height="24"  =""></td> </tr> <tr> <td height="1" bgcolor="#DAE1E9"></td> </tr> <tr> <td height="24"  =""></td> </tr> <tr> <td align="center"> <span style="color:#9BA6B2; font-size:12px; line-height:19px;"> <p> Questions about your deposit? Get in touch with our <a href="https://support.chiba.exchange" style="color: #43A047" target="_blank">customer support</a> team. </p> </span> </td> </tr> </tbody> </table> </td> </tr> <tr> <td height="40"></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table></body></html>',
        };
        sgMail.send(msg);
    },

    withdrawalRequest: function(requestEmail, withdrawalAmount, withdrawalMethod) {
        const msg = {
            to: 'ben@chiba.exchange',
            from: 'no-reply@chiba.exchange',
            subject: 'Withdrawal Request: ' + requestEmail,
            text: 'New withdrawal request from ' + requestEmail + ' for amount: $' + withdrawalAmount + ', withdrawalMethod: ' + withdrawalMethod,
            text: '<html><body><span>New withdrawal request from ' + requestEmail + ' for amount: $' + withdrawalAmount + ', withdrawalMethod: ' + withdrawalMethod + '. </span></body></html>'
        };
        sgMail.send(msg);
    }

}