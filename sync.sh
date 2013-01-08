#python2 ~/sagent &

git add .
git commit -m "blog update"
echo ">>pushing to github"
git push master master # github
echo ">>github pushed"
echo ">>pushing to phoenixzsec"
git push publish master # @phoenixzsec
echo ">>phoenixzsec pushed"
