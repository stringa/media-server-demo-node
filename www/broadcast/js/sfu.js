
var url = "wss://"+window.location.hostname+":"+window.location.port;
var roomId = (new Date()).getTime() + "-" + Math.random();


function addVideoForStream(stream,isLocal)
{
    //Create new video element
    const video = document.querySelector (isLocal ? "#localVideo" : "#remoteVideo");
    //Set same id
    video.id = stream.id;
    //Set src stream
    video.src = URL.createObjectURL(stream);
    //Set other properties
    video.autoplay = true;
    video.muted = true;
}
function removeVideoForStream(stream)
{
    //Get video
    var video = document.getElementById(stream.id);
    //Remove it when done
    video.addEventListener('webkitTransitionEnd',function(){
        //Delete it
        video.parentElement.removeChild(video);
    });
    //Disable it first
    video.className = "disabled";
}

var sdp;
var pc;

var localStream;
var remoteStream;
var localVideo;
var ws;

function pageReady() {

    localVideo = document.querySelector('#localVideo');
	var constraints = {
        audio: false,
        video: true
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        	addVideoForStream(stream, true);
		}).catch((e) => {
            console.error(e);
		});
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}


function connect() 
{

	if (window.RTCPeerConnection)
		pc = new RTCPeerConnection({
			bundlePolicy: "max-bundle",
			rtcpMuxPolicy : "require"
		});
	else
		pc = new webkitRTCPeerConnection(null);
	
	pc.onaddstream = function(event) {
		var prev = 0;
		console.debug("onAddStream",event);
		//Play it
		addVideoForStream(event.stream, false);
	};
	
	pc.onremovestream = function(event) {
		console.debug("onRemoveStream",event);
		//Play it
		removeVideoForStream(event.stream);
	};


    var url = "wss://"+window.location.hostname+":"+window.location.port;
    var ws = new WebSocket(url,"broadcast");

    ws.onopen = function(){
		console.log("opened");
		
		//Create new offer
		pc.createOffer({
				offerToReceiveVideo: true
			})
			.then(function(offer){
				console.debug("createOffer sucess",offer);
				//We have sdp
				sdp = offer.sdp;
				//Set it
				pc.setLocalDescription(offer);
				console.log(sdp);
				//Create room
				ws.send(JSON.stringify({
					cmd		: "OFFER",
					offer		: sdp
				}));
			})
			.catch(function(error){
				console.error("Error",error);
			});
	};
	
	ws.onmessage = function(event){
		debugger
		// console.log(event);
		
		//Get protocol message
		const msg = JSON.parse(event.data);
		
		console.log(msg.answer);
		pc.setRemoteDescription(new RTCSessionDescription({
				type:'answer',
				sdp: msg.answer
			}), function () {
				console.log("JOINED");
			}, function (err) {
				console.error("Error joining",err);
			}
		);
	};
}




