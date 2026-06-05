export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  console.info('[blob] token configured:', !!config.blobReadWriteToken)
})
