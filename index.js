var createAudio = require('simple-media-element').audio;

module.exports = function createMediaElementNode(props) {
  return new Promise(function(resolve, reject) {
    // create the audio media element
    var audio = createAudio(props.src);
    // create the node node that the web audio api needs
    var node = props.context.createMediaElementSource(audio);

    // bind onEnd dispatcher
    audio.addEventListener('ended', props.onEnd);

    // connect to the output
    var destination = props.context.destination;
    // but apply middleware if it exists
    if (typeof props.middleware === 'function') {
      destination = props.middleware(props.context, node);
    }
    node.connect(destination);

    // On most browsers the loading begins immediately. However, on iOS 9.2 Safari,
    // you need to call load() for events to be triggered.
    audio.load();

    function onReady() {
      resolve({
        audio: audio,
        node: node
      });
    }

    if (audio.readyState >= audio.HAVE_ENOUGH_DATA) {
      onReady();
    } else {
      audio.addEventListener('canplay', function onReadyToPlay() {
        audio.removeEventListener('canplay', onReadyToPlay);
        onReady();
      });

      audio.addEventListener('error', function onError() {
        audio.removeEventListener('error', onError);
        reject();
      });
    }
  });
}
