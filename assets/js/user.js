// If user stay inactive more than 3 minutes he will automatically logout
function detectIdelTimeFunc(){
	let time;
	let idelTimeLimit=180000; // 1000=1 second
	document.onmousemove=activityTimer;
	document.onkeydown=activityTimer;

function detectInactivityFunc(){
alert('detected inactivity')	;
document.getElementById('logout').click();

}
function activityTimer(){
	clearTimeout(time);
time=setTimeout(detectInactivityFunc,idelTimeLimit);
//output.innerHTML=`Activity  ${time} times `

}
};
detectIdelTimeFunc();


//  header configuration (download public private keys)
function downloadFile(filename, content) {
    // It works on all HTML5 Ready browsers as it uses the download attribute of the <a> element:
    const element = document.createElement('a');
      
    //A blob is a data type that can store binary data
    // "type" is a MIME type
    // It can have a different value, based on a file you want to save
    const blob = new Blob([content], { type: 'plain/text' });
    
    //createObjectURL() static method creates a DOMString containing a URL representing the object given in the parameter.
    const fileUrl = URL.createObjectURL(blob);
    
    //setAttribute() Sets the value of an attribute on the specified element.
    element.setAttribute('href', fileUrl); //file location
    element.setAttribute('download', filename); // file name
    element.style.display = 'none';
    
    //use appendChild() method to move an element from one element to another
    document.body.appendChild(element);
    element.click();
    
    //The removeChild() method of the Node interface removes a child node from the DOM and returns the removed node
    document.body.removeChild(element);
    };
    
    window.onload = () => {
    document.getElementById('downloadPublicKey').
    addEventListener('click', e => {
      
      //The value of the file name input box
      const publicKey ="publicKey.txt";
      
      //The value of what has been input in the textarea
      const content1 = document.getElementById('publicKeyText').value;
      
      // The && (logical AND) operator indicates whether both operands are true. If both operands have nonzero values, the result has the value 1 . Otherwise, the result has the value 0.
      
      if (publicKey && content1) {
        downloadFile(publicKey, content1);
      }
    });
    document.getElementById('downloadPrivateKey').
    addEventListener('click', e => {
      
      //The value of the file name input box
      const privateKey ="privateKey.txt";
      
      //The value of what has been input in the textarea
      const content2 = document.getElementById('privateKeyText').value;
      
      // The && (logical AND) operator indicates whether both operands are true. If both operands have nonzero values, the result has the value 1 . Otherwise, the result has the value 0.
      
      if (privateKey && content2) {
        downloadFile(privateKey, content2);
      }
    });
    };

    document.getElementById('buttonKey').addEventListener('click',function(){
    document.querySelector('.bg-modal').style.display='flex';
  });
  

  function closePopup(){
    document.querySelector('.bg-modal').style.display='none';

  }