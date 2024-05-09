this.checkFile(fileObj, chunks)
  .then(async (res) => {
    console.log(res)
    if (res.data.data.completed) {
      // 如果当前文件已经上传成功 则无需继续上传
      fileObj.progress = 100
      fileObj.status = '上传成功'
      // 为成功上传的附件添加id
      if (res.data.data.attachmentId) {
        fileObj.attachmentId = res.data.data.attachmentId
      }
      this.$forceUpdate() // 强制重新渲染组件
      this.$emit('fileUpdate')
    } else {
      // 当前文件没有上传成功
      // 获取已经上传的分片数组
      let uploadedChunks = res.data.data.uploadChunks
      // 获取当前的进度
      let newProgress = parseInt((uploadedChunks.length / chunks) * 100)
      fileObj.progress = newProgress
      this.$forceUpdate() // 强制重新渲染组件
      // 文件均已上传完 但还未合并
      if (res.data.data.canMerge || uploadedChunks.length == chunks) {
        this.mergeBigFile(fileObj)
          .then((res) => {
            fileObj.status = '合并中'
            this.$forceUpdate() // 强制重新渲染组件
            // 先清除该文件上次的合并计时器
            if (fileObj.mergeTimer) {
              clearInterval(fileObj.mergeTimer)
            }
            fileObj.mergeTimer = setInterval(() => {
              this.getMergeProcess(fileObj).then((res) => {
                if (res.data.data.completed) {
                  fileObj.status = '上传成功'
                  // 为成功上传的附件添加id
                  if (res.data.data.attachmentId) {
                    fileObj.attachmentId = res.data.data.attachmentId
                  }
                  this.$forceUpdate() // 强制重新渲染组件
                  // 合并完成
                  fileObj.requests = []
                  fileObj.cancelTokens = []
                  clearInterval(fileObj.mergeTimer)
                  this.$emit('fileUpdate')
                }
              })
            }, 2000)
          })
          .catch((error) => {
            console.error('上传失败:', error)
            fileObj.status = '上传失败'
            if (fileObj.mergeTimer) {
              clearInterval(fileObj.mergeTimer)
            }
            this.$forceUpdate()
          })
      } else {
        // 文件还没上传完
        let currentChunk = 0
        // 上传没有上传的部分
        while (currentChunk < chunks) {
          if (!uploadedChunks.includes(currentChunk)) {
            const start = currentChunk * this.chunkSize
            const end = Math.min(start + this.chunkSize, fileObj.file.size)
            const chunk = fileObj.file.slice(start, end)
            // 构造该块的上传请求
            const formData = new FormData()
            let fileType = fileObj.file.name.substring(
              fileObj.file.name.lastIndexOf('.') + 1,
            )
            formData.append('fileName', fileObj.file.name)
            formData.append('fileType', fileType)
            formData.append('md5', fileObj.md5)
            formData.append('category', fileObj.category)
            formData.append('ownerType', 'bill')
            formData.append('ownerId', this.billidParam)
            formData.append('chunkNum', currentChunk)
            formData.append('chunkSize', this.chunkSize)
            formData.append('chunkTotal', chunks)
            formData.append('file', chunk)
            // 该块的取消令牌
            let cancelToken = axios.CancelToken.source()
            fileObj.cancelTokens.push(cancelToken)
            let request = GMS.$http.post(
              '/bsp/bjgzw/attachment/uploadChunk',
              formData,
              {
                headers: this.headers,
                cancelToken: cancelToken.token,
              },
            )
            fileObj.requests.push(request)
          }
          currentChunk++
        }
        // 当前文件下的所有请求
        for (let i = 0; i < fileObj.requests.length; i++) {
          fileObj.requests[i]
            .then((res) => {
              console.log(res)
              // 进行进度控制
              let progress = parseInt(
                (res.data.data.uploadChunks.length / chunks) * 100,
              )
              if (progress > fileObj.progress) {
                fileObj.progress = progress
                this.$forceUpdate() // 强制重新渲染组件
              }
              // 进行文件的合并控制
              if (res.data.data.canMerge) {
                // 文件可以合并了
                this.mergeBigFile(fileObj)
                  .then((res) => {
                    fileObj.status = '合并中'
                    this.$forceUpdate() // 强制重新渲染组件
                    // 先清除该文件上次的合并计时器
                    if (fileObj.mergeTimer) {
                      clearInterval(fileObj.mergeTimer)
                    }
                    fileObj.mergeTimer = setInterval(() => {
                      this.getMergeProcess(fileObj).then((res) => {
                        if (res.data.data.completed) {
                          fileObj.status = '上传成功'
                          // 为成功上传的附件添加id
                          if (res.data.data.attachmentId) {
                            fileObj.attachmentId = res.data.data.attachmentId
                          }
                          this.$forceUpdate() // 强制重新渲染组件
                          // 合并完成
                          fileObj.requests = []
                          fileObj.cancelTokens = []
                          clearInterval(fileObj.mergeTimer)
                          this.$emit('fileUpdate')
                        }
                      })
                    }, 2000)
                  })
                  .catch((error) => {
                    console.error('上传失败:', error)
                    fileObj.status = '上传失败'
                    if (fileObj.mergeTimer) {
                      clearInterval(fileObj.mergeTimer)
                    }
                    this.$forceUpdate()
                  })
              }
            })
            .catch((error) => {
              if (axios.isCancel(error)) {
                console.log('上传已暂停或取消')
              } else {
                console.error('上传失败:', error)
                fileObj.status = '上传失败'
                this.$forceUpdate()
              }
              fileObj.requests = []
              fileObj.cancelTokens = []
            })
        }
      }
    }
  })
  .catch((error) => {
    console.error('Error:', error)
    fileObj.status = '上传失败'
    this.$forceUpdate()
  })
