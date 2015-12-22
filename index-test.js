var test = require('tape');
var sinon = require('sinon');

var audioNotReady = {
  addEventListener: sinon.spy(),
  load: sinon.spy(),
  readyState: 1,
  removeEventListener: sinon.spy(),
  HAVE_ENOUGH_DATA: 4
};
var audioReady = {
  addEventListener: sinon.spy(),
  load: sinon.spy(),
  readyState: 4,
  removeEventListener: sinon.spy(),
  HAVE_ENOUGH_DATA: 4
};
var audio = sinon.stub();
audio.withArgs('not-ready').returns(audioNotReady);
audio.withArgs('ready').returns(audioReady);

var createMediaElementNode = require('proxyquire').noCallThru()('./index', {
  'simple-media-element': {
    audio: audio
  }
});

test('#createMediaElementNode with a source ready to play and middleware', function(t) {
  var node = {
    connect: sinon.spy()
  };
  var context = {
    createMediaElementSource: sinon.stub().returns(node),
    destination: 'destination'
  };
  var middleware = sinon.stub().returns('middleware-destination');
  var onEnd = sinon.spy();

  var promise = createMediaElementNode({
    context: context,
    middleware: middleware,
    src: 'ready',
    onEnd: onEnd
  });

  t.equals(typeof promise.then, 'function', 'returns a promise');

  promise.then(function(res) {
    t.ok(context.createMediaElementSource.calledWith(audioReady), 'calls createMediaElementSource with audio');
    t.ok(audioReady.addEventListener.calledWith('ended', onEnd), 'attaches onEnd to the endede event through audio.addEventListener');
    t.ok(middleware.calledWith(context, node), 'calls the middleware');
    t.ok(node.connect.calledWith('middleware-destination'), 'calls the node with the middleware destination');
    t.ok(audioReady.load.called, 'calls audio.load');

    t.deepEquals(res, {
      audio: audioReady,
      node: node
    }, 'if the audio is ready it resolves audio and node in an object');

    t.end();
  });
});

test('#createMediaElementNode with a source ready to play and no middleware', function(t) {
  var node = {
    connect: sinon.spy()
  };
  var context = {
    createMediaElementSource: sinon.stub().returns(node),
    destination: 'destination'
  };
  var onEnd = sinon.spy();

  var promise = createMediaElementNode({
    context: context,
    src: 'ready',
    onEnd: onEnd
  });

  t.equals(typeof promise.then, 'function', 'returns a promise');

  promise.then(function(res) {
    t.ok(context.createMediaElementSource.calledWith(audioReady), 'calls createMediaElementSource with audio');
    t.ok(audioReady.addEventListener.calledWith('ended', onEnd), 'attaches onEnd to the endede event through audio.addEventListener');
    t.ok(node.connect.calledWith(context.destination), 'calls the node with the context destination');
    t.ok(audioReady.load.called, 'calls audio.load');

    t.deepEquals(res, {
      audio: audioReady,
      node: node
    }, 'if the audio is ready it resolves audio and node in an object');

    t.end();
  });
});

test('#createMediaElementNode with a source that is not ready', function(t) {
  var node = {
    connect: sinon.spy()
  };
  var context = {
    createMediaElementSource: sinon.stub().returns(node),
    destination: 'destination'
  };

  var promise = createMediaElementNode({
    context: context,
    src: 'not-ready'
  });

  t.ok(audioNotReady.addEventListener.firstCall.args[0], 'canplay', 'calls canplay');
  t.end();
});
