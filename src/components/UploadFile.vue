<template>
  <el-upload
    accept="*/*"
    :before-upload="beforeUpload"
    :http-request="upload"
    :show-file-list="false"
    :disabled="disabled"
    style="display: inline-block"
    class="m-x-12"
  >
    <el-tooltip placement="bottom">
      <template #content>可上传本地文件</template>
      <el-button type="primary" style="font-size: 12px" :disabled="disabled">
        上传文件
      </el-button>
    </el-tooltip>
  </el-upload>
  <el-dialog
    v-model="dialogVisible"
    :fullscreen="true"
    :show-close="false"
    custom-class="dispute-upload-dialog"
  >
    <div class="center">
      <div class="fz-18 ellipsis">正在上传：{{ fileData.name }}</div>
      <el-progress
        :text-inside="true"
        :stroke-width="16"
        :percentage="percentage"
      />
      <el-button @click="cancel">取消上传</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import SparkMD5 from 'spark-md5'
import * as process from 'node:process'

const beforeUpload = (file: File) => {
  if (file.size / 1024 / 1024 / 1024 > 1.5) {
    ElMessage.error('文件大小不能超过 1.5G')
    ElMessage({
      type: 'error',
      message: '文件大小不能超过 1.5G',
      duration: 6000,
    })
    return false
  }
  return true
}
const url = 'http://bdap.cmu.edu.cn:30004'
const dialogVisible = ref(false)
const cancelUpload = ref(false)
let controller: AbortController | null = null
const CHUNK_SIZE = 4 * 1024 * 1024 // 切片大小
let progress = ref(0)
const percentage = ref(0)
let source = null
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
const cancel = () => {
  dialogVisible.value = false
  cancelUpload.value = true
  controller?.abort()
  // axios.post('cancelUpload', { folder: fileData.value.md5 })
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

const updateUrl = (fileUrl: string) => {
  axios.post('saveUrl', {
    fileName: fileData.value.name,
    fileUrl,
  })
}

const uploadChunkFile = async (
  i: number,
  start: number,
  end: number,
  fileObj: File,
) => {
  const chunkFile = fileObj.slice(start, end + 1) // 切片文件
  const chunkCheckSum = (await calc_checksum(chunkFile, null)) as string
  const formData = new FormData() // formData 参数需要与后端对齐
  formData.append('chunk', chunkFile)
  formData.append('file_identifier', file_identifier.value)
  formData.append('number', i)
  formData.append('checksum', chunkCheckSum)
  // formData.append('file', chunkFile, String(i + 1)) // 必传字段；若第三个参数不传，切片 filename 默认是 blob ，如果后端是以切片名称来做合并的，则第三个参数一定要传
  controller = new AbortController() // 每一次上传切片都要新生成一个 AbortController ，否则重新上传会失败
  return await axios
    .post(url + '/upload_chunk', formData, {
      // 调用后端上传切片接口
      onUploadProgress: (data) => {
        // 进度条展示
        percentage.value = Number(
          (
            (Math.min(fileData.value.size, start + data.loaded) /
              fileData.value.size) *
            100
          ).toFixed(2),
        )
      },
      signal: controller.signal, // 取消上传
    })
    .then((res) => {
      progress.value = res.data['data']['progress']
    })

  // .then((res) => updateUrl(res.data))
}

const batchUpload = async (fileObj: File) => {
  percentage.value = 0 // 每次上传文件前清空进度条
  dialogVisible.value = true // 显示上传进度
  cancelUpload.value = false // 每次上传文件前将取消上传标识置为 false
  for (let data in remaining_chunks.value) {
    const res = await uploadChunkFile(
      remaining_chunks.value[data][0],
      remaining_chunks.value[data][1],
      remaining_chunks.value[data][2],
      fileObj,
    ) // 上传切片
    // if (0) {
    //   // 切片上传失败
    //   dialogVisible.value = false
    //   ElMessageBox({ message: `${fileData.value.name}上传失败`, title: '提示' })
    //   return
    // }
    if (progress.value === 1) break
  }
  if (progress.value === 1) {
    // 最后一片切片上传成功
    setTimeout(() => {
      // 延迟关闭上传进度框用户体验会更好
      dialogVisible.value = false
      axios
        .put(
          url +
            '/combine_chunks/' +
            file_identifier.value +
            '/' +
            file_checksum.value,
        ) // 调用后端合并切片接口，参数需要与后端对齐
        .then((res) => {
          // updateUrl(res.data)
          console.log(res.data)
          ElMessageBox({
            message: `${fileData.value.name}上传成功`,
            title: '提示',
          })
        }) // 调用后端保存上传文件路径接口
    }, 500)
    return
  }
}

const disabled = ref(false)
const file_identifier = ref('')
const remaining_chunks = ref([])
const file_checksum = ref('')
const upload = async (file: { file: File }) => {
  const fileObj = file.file
  const nameList = fileObj.name.split('.')
  fileData.value.user_id = 10000
  fileData.value.task_id = 0
  fileData.value.name = fileObj.name
  fileData.value.path = '/'
  fileData.value.modify_time = '2024-05-03T14:03:50'
  fileData.value.size = fileObj.size
  fileData.value.chunk_size = CHUNK_SIZE
  fileData.value.secret = '4t76gjsdhcnoaweyfqw3849yfiuasdfn'



  axios.post(url + '/create_upload_identifier', fileData.value).then((res) => {
    file_identifier.value = res.data['data']['identifier']
    remaining_chunks.value = res.data['data']['remaining_chunks']
    progress.value = res.data['data']['progress']
    console.log(res.data)
  })
  file_checksum.value = (await calc_checksum(
    fileObj,
    1024 * 1024 * 4,
  )) as string
  batchUpload(fileObj) // 大文件切片上传
}
</script>

<style lang="scss">
.dispute-upload-dialog {
  background: none;
}
</style>

<style lang="scss" scoped>
.center {
  color: #fff;
  width: 50%;
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
