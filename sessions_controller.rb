require 'token_manager'

#this controller only handles sessions for api authroization. this is not a devise controller
class SessionsController < ApplicationController
	include Devise::Controllers::Helpers
  
  before_filter :require_api_key, :api_session_token_authenticate
  skip_before_filter :api_session_token_authenticate, :only => [:create, :register]
  
  respond_to :json

  #POST
  #/api/sign_in
  #input json { email:x, password:x }
  #creates a new session token for a user
  #if the user is already logged in, it will update the token's last_seen
  def create
  	jsonParams = validate_params

  	if jsonParams.nil?
  		_not_authorized "invalid parameters"
  	else
  		@user = User.find_by_email(jsonParams['email'])
  		

  		if @user and @user.valid_password?(jsonParams['password'])
  			
  			#this is a valid user, create a token and save their id in the token
  			@token = create_api_session_token
        @token.user = @user.id

  			@repsonse = {:id => @token.user.to_s, :username => @user.username, :token => @token.getToken, :expires_in => @token.timeToExpiration.to_s }
  			render :status => 200, :json => @repsonse
  		else
  			_not_authorized	"invalid username or password"
  		end
    end#param check
  end #create

  #POST
  #api/sign_in/facebook ? uid=x & email=x & username=x & auth_token=x 
  #signs in or creates a user and signs in, with a valid facebook uid and authtoken
  def createFacebook
    jsonParams = validate_facebook_params
    if jsonParams.nil?
      _not_authorized "invalid parameters"
    else
      #create and auth object. liek the one for omniauth-facebook

      #create a user obj
      @user = User.find_for_facebook_oauth_api_session(jsonParams)

      #make sure auth_token is valid
      response = HTTParty.get("https://graph.facebook.com/me?access_token="+jsonParams['auth_token'])

      #200 and id & uid must match
      if(response.code == 200)
        #puts "response is 200"
        responseJson = JSON.parse(response.body)
        #puts "comparing "+responseJson['id'] +" and "+@user.uid
        if( responseJson['id'] != @user.uid )
          _not_authorized "invalid facebook credentials" 
        else
            #valid facebook token and user

            #is this user in our database
            if @user.persisted?
              puts "user exitss"
              @token = create_api_session_token
              @token.user = @user.id

              @repsonse = {:id => @token.user.to_s, :username => @user.username, :token => @token.getToken, :expires_in => @token.timeToExpiration.to_s }
              render :status => 200, :json => @repsonse
            else
                #create their account and return a session token
                begin
                    if @user.save!
                      #create a token and save their id in the token
                      @token = create_api_session_token
                      @token.user = @user.id

                      @repsonse = {:id => @token.user.to_s, :username => @user.username, :token => @token.getToken, :expires_in => @token.timeToExpiration.to_s }
                      render :status => 200, :json => @repsonse
                    else
                      _not_authorized "could not create account"
                    end
                rescue Exception => e
                  _not_authorized "failed to sign up through Facebook: "+e.to_s
                end

            end#persisted?
        end#valid facebook user
      else
        _not_authorized "invalid facebook credentials"
      end#respone code?
    end #param check
  end

  #validates the presense of uid, email, username, auth_token
  #return Hash if valid, nil otherwise
  #caller must test for nil
  def validate_facebook_params
    @uid = nil
    @email = nil
    @username = nil
    @auth_token = nil

    begin
      jsonBody = JSON.parse(request.body.read)
      if jsonBody.has_key? 'uid'
        @uid = jsonBody['uid']
      end
      if jsonBody.has_key? 'email'
        @email = jsonBody['email']
      end
      if jsonBody.has_key? 'username'
        @username = jsonBody['username']
      end
      if jsonBody.has_key? 'auth_token'
        @auth_token = jsonBody['auth_token']
      end      
    rescue Exception => e
        puts "failed"
    end

    #set json, but not if uid, email, password or auth_token wasn't given
    { 'uid'=> @uid,'email'=> @email, 'username'=> @username, 'auth_token' => @auth_token } unless @uid.nil? or @email.nil? or @username.nil? or @auth_token.nil?
  end

  #return message for unauthorized connection attempts
  def _not_authorized message = "Not Authorized"
    @repsonse = {:status => "error", :msg => message}
    respond_to do |format|
              format.html  { render :status => 401, :text => @repsonse }
              format.json  { render :json => @repsonse, :status => 401  }
    end
  end

  #create a new token
  #should only be used for sign_up and sign_in
  def create_api_session_token
    @session_token ||= ApiSessionTokenManager.new( nil )
  end

end
