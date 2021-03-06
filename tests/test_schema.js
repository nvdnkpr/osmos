var expect = require('chai').expect;

var Osmos = require('../lib');

var Schema = Osmos.Schema;

describe('The Schema class', function() {
  
  it('should exist', function() {
    expect(Schema).to.be.a('function');
  });
  
  it('should support JSON-Schema schemas', function() {
    var schema = new Schema(
      'schema',
      {
        $schema: "http://json-schema.org/draft-04/schema#",
        type: 'number',
        minimum: 10
      }
    );
    
    expect(schema).to.be.an('object');
  });
  
  it('should reject invalid schemas', function() {
    function f() {
      var schema = new Schema(
        'schema',
        {
          $schema: "http://json-schema.org/draft-04/schema#",
          type: 'shalala',
          minimum: 10
        }
      );
    }
    
    expect(f).to.throw(Error);
  });
  
  it('should allow registering additional schemas', function(done) {
    Schema.registerSchema('test', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'number',
      minimum: 10
    });
    
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      properties: {
        val: {
          $ref: 'test'
        }
      }
    });
    
    if (schema.loaded) {
      done();
    }
  });
  
  it('should allow using external schemas', function(done) {
    Schema.registerSchema('test', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'number',
      minimum: 10
    });
    
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      properties: {
        val: {
          $ref: 'https://api.tabini.ca/validate/rule/test.model'
        }
      }
    });

    schema.on('loaded', done);
  });
  
  it('should properly validate a valid document', function(done) {
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      required: ['val'],
      properties: {
        val: {
          type: 'number',
          minimum: 10
        }
      }
    });
    
    schema.validateDocument(
      {val: 11},
      
      function(err) {
        expect(err).to.be.null;

        done();
      }
    );
  });
  
  it('should report errors when validating an invalid document', function(done) {
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      required: ['val'],
      properties: {
        val: {
          type: 'number',
          minimum: 10
        }
      }
    });
    
    schema.validateDocument(
      {val: 9},
      
      function(err) {
        expect(err).to.be.an('object');
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('errors');
        expect(err.errors).to.be.an('array');
        expect(err.errors.length).to.equal(1);
        
        done();
      }
    );
  });
  
  it('should properly support validation hooks', function(done) {
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      required: ['val'],
      properties: {
        val: {
          type: 'number',
          minimum: 10
        }
      }
    });
    
    schema.hook('didValidate', function(doc, cb) {
      cb(new Osmos.Error('Invalid reconfibulator flows detected.', 400));
    });
    
    schema.validateDocument(
      {val: 11},
      
      function(err) {
        expect(err).to.be.an('object');
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('errors');
        expect(err.errors).to.be.an('array');
        expect(err.errors.length).to.equal(0);
        
        done();
      }
    );
  });
  
  it('should support format validators', function(done) {
    var schema = new Schema('marco', {
      $schema: "http://json-schema.org/draft-04/schema#",
      type: 'object',
      required: ['email'],
      properties: {
        email: {
          type: 'string',
          format: 'email'
        }
      }
    });
    
    schema.validateDocument({ email : 'invalid' }, function(err) {
      expect(err).to.be.an('object');
      expect(err).to.be.an.instanceOf(Error);
      expect(err).to.have.property('errors');
      expect(err.errors).to.have.length(1);
      expect(err.errors[0].dataPath).to.equal('/email');
      
      done();
    });
  });
  
});