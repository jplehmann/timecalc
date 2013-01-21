use Rack::Static, 
  :urls => ["/js", "/css", "/lib"],
  :root => "public"

run lambda { |env|
  [
    200, 
    {
      'Content-Type'  => 'text/html', 
      'Cache-Control' => 'public, max-age=86400' 
    },
    File.open('public/timecalc.html', File::RDONLY)
  ]
}
