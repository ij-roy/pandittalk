require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name             = 'ExpoPanditChime'
  s.version          = package['version']
  s.summary          = package['description']
  s.license          = { :type => 'MIT' }
  s.authors          = { 'PanditTalk' => 'support@pandittalk.com' }
  s.homepage         = 'https://pandittalk.com'
  s.platforms        = { :ios => '15.1' }
  s.source           = { :git => 'https://github.com/pandittalk/PanditTalk-Monorepo.git' }
  s.static_framework = true
  s.source_files     = 'ios/**/*.{h,m,mm,swift}'
  s.dependency 'ExpoModulesCore'
  # The full media pod is required for VideoRenderView and camera capture.
  s.dependency 'AmazonChimeSDK', '~> 0.27.3'
end
