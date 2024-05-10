<template>
  <div>
    <input @change="handleUpload" type="file" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SparkMD5 from 'spark-md5'
import axios from 'axios'
import { ElMessageBox } from 'element-plus'

const CHUNK_SIZE = 1024 * 1024 * 4
const url = 'http://bdap.cmu.edu.cn:30004'
const USER_ID = 10000
const TASK_ID = 0
const TASK_PATH = '/'
const fileHash = ref<string>('')
const fileName = ref<string>('')
const file_identifier = ref<string>('')

const createChunks = (file: File) => {
  let chunks = []
  let cur = 0
  while (cur < file.size) {
    chunks.push(file.slice(cur, cur + CHUNK_SIZE))
    cur += CHUNK_SIZE
  }
  return chunks
}
const calc_checksum = async (file: any, chunk_size: any) => {
  if (chunk_size === null) {
    return new Promise((resolve, reject) => {
      const spark = new SparkMD5.ArrayBuffer()
      const fileReader = new FileReader()
      fileReader.onload = (e): void => {
        spark.append(e.target?.result)
        resolve(spark.end())
      }
      fileReader.onerror = () => {
        reject('')
      }
      fileReader.readAsArrayBuffer(file)
    })
  } else {
    let currentChunkNum = 0
    const chunkCnt = Math.ceil(file.size / chunk_size)
    // let currentChunk = file.slice(0, chunk_size>file.size?file.size:chunk_size)
    return new Promise((resolve, reject) => {
      let spark = new SparkMD5.ArrayBuffer()
      let fileReader = new FileReader()
      fileReader.onload = (e): void => {
        spark.append(e.target?.result)
        currentChunkNum++
        if (currentChunkNum < chunkCnt) {
          loadNext()
        } else {
          resolve(spark.end())
        }
      }
      fileReader.onerror = (e) => {
        reject(e)
      }
      const loadNext = () => {
        const start = currentChunkNum * chunk_size
        // const end = Math.min(file.size, start + chunk_size)

        fileReader.readAsArrayBuffer(file.slice(start, start + 16))
      }
      loadNext()
    })
  }
}

const mergeRequest = () => {
  axios
    .put(
      url + '/combine_chunks/' + file_identifier.value + '/' + fileHash.value,
    ) // 调用后端合并切片接口，参数需要与后端对齐
    .then((res) => {
      if (res.data.message === 'Checksum mismatch') {
        // md5值不匹配
        console.log(res.data.message)
      } else if (res.data.message === 'Success') {
        ElMessageBox({
          message: `${fileData.value.name}上传成功`,
          title: '提示',
        })
      }
    })
}

let timeoutCnt = ref(0)
const MAX_TIMEOUT = 3

const uploadChunk = async (chunks: Blob[], remainingChunks: number[]) => {
  const data = chunks.map((chunk, index) => {
    return {
      chunk,
      number: index,
    }
  })
  const formDatas = await Promise.all(
    data
      .filter((item) => {
        return remainingChunks.includes(item.number)
      })
      .map(async (item) => {
        const formData = new FormData()
        formData.append('chunk', item.chunk)
        formData.append('file_identifier', file_identifier.value)
        formData.append('number', item.number.toString())
        const chunckHash = (await calc_checksum(item.chunk, null)) as string
        formData.append('checksum', chunckHash)
        return formData
      }),
  )
  // console.log(formDatas[0].get('checksum'))

  const max = 6
  let index = 0
  const taskPool: any = []

  // 这里的多线程上传有bug，实际上使用 awit axios 单线程上传

  while (index < formDatas.length) {
    // const task = axios
    //   .post(url + '/upload_chunk', formDatas[index])
    //   .then((res) => {
    //     console.log(res.data)
    //   })
    //
    // taskPool.splice(taskPool.findIndex((item: any) => item === index))
    // taskPool.push(task)
    // if (taskPool.length === max) {
    //   await Promise.race(taskPool)
    // }

    try {
      await axios
        .post(url + '/upload_chunk', formDatas[index], { timeout: 1 }) // 设置超时时间为5000毫秒)
        .catch((error) => {
          if (error.code === 'ECONNABORTED') {
            while (timeoutCnt.value < MAX_TIMEOUT) {
              await axios
                .post(url + '/upload_chunk', formDatas[index], {
                  timeout: 1,
                })
                .then((res) => {
                  if (res.data.message === 'Success') {
                    return
                  } else {
                    timeoutCnt.value++
                  }
                }).catch((e) => {
                  console.log(e)
                }
            }
            ElMessageBox({
              message: `请求超时，请稍后重试`,
              title: '提示',
            })
            throw new Error('请求超时，终止传输')
          }
          throw error
        })
    } catch (e) {
      throw e
    }

    index++
  }
  console.log(index)

  await Promise.all(taskPool)

  mergeRequest()
}

const fileData = ref({
  user_id: 0,
  task_id: 0,
  name: '',
  path: '',
  modify_time: '',
  size: 0,
  chunk_size: 1024 * 1024 * 4,
  secret: '',
}) // 文件信息

const handleUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  fileName.value = files[0].name
  const chunks = createChunks(files[0])

  const hash = await calc_checksum(files[0], CHUNK_SIZE)
  fileHash.value = hash as string
  fileData.value.user_id = 10000
  fileData.value.task_id = 0
  fileData.value.name = fileName.value
  fileData.value.path = '/'
  fileData.value.modify_time = '2024-05-03T14:03:50'
  fileData.value.size = files[0].size
  fileData.value.chunk_size = CHUNK_SIZE
  fileData.value.secret = '4t76gjsdhcnoaweyfqw3849yfiuasdfn'
  console.log(hash)
  let remainingChunks: number[] = []
  await axios
    .post(url + '/create_upload_identifier', fileData.value)
    .then((res) => {
      file_identifier.value = res.data['data']['identifier']
      console.log(res.data)
      for (let item in res.data['data']['remaining_chunks']) {
        remainingChunks.push(
          res.data['data']['remaining_chunks'][item][0] as number,
        )
      }
    })

  uploadChunk(chunks, remainingChunks).catch((e) => {
    console.log(e)
  })
}
</script>
