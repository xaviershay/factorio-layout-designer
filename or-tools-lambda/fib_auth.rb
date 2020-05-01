require 'net/http'
require 'uri'
require 'json'

require 'aws-sdk-ssm'

def lambda_handler(event:, context:)
  uri = URI.parse("https://api.factorio-item-browser.com/auth")
  client = Aws::SSM::Client.new
  param = client.get_parameter({
    name: "fib-access-key",
    with_decryption: true,
  })

  key = param.parameter.value

  header = {
    'Content-Type': 'application/json',
    'accept': 'application/json',
  }

  body = {
    accessKey: key,
    modNames: [
      "base"
    ]
  }

  # Create the HTTP objects
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == 'https'
  request = Net::HTTP::Post.new(uri.request_uri, header)
  request.body = body.to_json

  # Send the request
  response = http.request(request)

  { statusCode: response.code, body: response.body }
end
