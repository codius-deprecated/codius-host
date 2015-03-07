expected="e9f32f730046f6522f52fbab4edb22485bfdd0e2a873e81c65337384c3d1bffe"
cd test/test_contract
CODIUS_UNAUTHORIZED_SSL=true CODIUS_HOST=Http://localhost:8080/ codius upload | tee /tmp/upload-output
token=$(grep 'Application metadata' /tmp/upload-output | awk -F '/' '{print $5}')
curl -k https://localhost:8080/token/${token} | tee /tmp/api-output
hash=$(cat /tmp/api-output | jq .hash -r)

if [ "${expected}" != "${hash}" ];then
  echo "Contract hash mismatch. ${hash} != ${expected}"
  exit 1
else
  echo "Contract hashes match."
  exit 0
fi
