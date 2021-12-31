rm -r docs
yarn build
mv dist docs
git add .
git commit -m "update"
git push origin master