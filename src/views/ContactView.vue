<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

import { addContact, deleteContact, getContacts } from '@/api/contact'
import type { Contact } from '@/api/contact'

// ===== 新增联系人表单 =====
const formRef = ref<FormInstance>()

const form = reactive({
  student_id: '',
  name: '',
  sex: '',
  phone_num: '',
  major: '',
  note: '',
})

const rules: FormRules<typeof form> = {
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  phone_num: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
}

const submitting = ref(false)

async function handleAdd() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true

  try {
    await addContact({
      student_id: form.student_id.trim(),
      name: form.name.trim(),
      sex: form.sex,
      phone_num: form.phone_num.trim(),
      major: form.major.trim(),
      note: form.note.trim(),
    })

    ElMessage.success('联系人添加成功')
    formRef.value?.resetFields()
    // 新加的在第一页，回到第一页刷新
    currentPage.value = 1
    loadContacts()
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    submitting.value = false
  }
}

// ===== 联系人列表 =====
const contacts = ref<Contact[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 15 // 后端写死每页 15 条
const total = ref(0)
const deletingId = ref<number | null>(null)

async function loadContacts() {
  loading.value = true
  try {
    const data = await getContacts(currentPage.value)
    contacts.value = data.list
    total.value = data.total
  } catch {
    // 失败提示已由 http.ts 统一弹出
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  loadContacts()
}

async function handleDelete(contact: Contact) {
  try {
    await ElMessageBox.confirm(
      `确定删除联系人「${contact.name}」吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return // 用户点了取消
  }

  deletingId.value = contact.contact_id

  try {
    await deleteContact(contact.contact_id)
    ElMessage.success('联系人已删除')

    // 当前页删空了就退回上一页，否则停留在本页刷新
    if (contacts.value.length === 1 && currentPage.value > 1) {
      currentPage.value -= 1
    }
    loadContacts()
  } catch {
    // 失败提示已由 http.ts 统一弹出（比如"这不是你的联系人"）
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  loadContacts()
})
</script>

<template>
  <div class="contact-page">
    <div class="page-header">
      <h2>我的联系人</h2>
      <p>保存常用联系人的信息，方便查找</p>
    </div>

    <!-- 新增联系人 -->
    <el-card class="form-card">
      <template #header>
        <span>新增联系人</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @submit.prevent
      >
        <div class="form-grid">
          <el-form-item label="学号" prop="student_id">
            <el-input
              v-model="form.student_id"
              maxlength="30"
              placeholder="请输入学号"
            />
          </el-form-item>

          <el-form-item label="姓名" prop="name">
            <el-input
              v-model="form.name"
              maxlength="30"
              placeholder="请输入姓名"
            />
          </el-form-item>

          <el-form-item label="性别" prop="sex">
            <el-radio-group v-model="form.sex">
              <el-radio value="男">
                男
              </el-radio>
              <el-radio value="女">
                女
              </el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="手机号" prop="phone_num">
            <el-input
              v-model="form.phone_num"
              maxlength="20"
              placeholder="请输入手机号"
            />
          </el-form-item>

          <el-form-item label="专业" prop="major">
            <el-input
              v-model="form.major"
              maxlength="50"
              placeholder="选填"
            />
          </el-form-item>

          <el-form-item label="备注" prop="note">
            <el-input
              v-model="form.note"
              maxlength="200"
              placeholder="选填"
            />
          </el-form-item>
        </div>

        <el-form-item>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleAdd"
          >
            添加联系人
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 联系人列表 -->
    <el-card>
      <template #header>
        <span>联系人列表（共 {{ total }} 人）</span>
      </template>

      <el-table
        v-loading="loading"
        :data="contacts"
        empty-text="暂无联系人，先在上方添加一个吧"
      >
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="sex" label="性别" width="70" />
        <el-table-column prop="student_id" label="学号" min-width="120" />
        <el-table-column prop="phone_num" label="手机号" min-width="130" />
        <el-table-column prop="major" label="专业" min-width="130" />
        <el-table-column prop="note" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              plain
              size="small"
              :loading="deletingId === row.contact_id"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > pageSize" class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.contact-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
}

.page-header p {
  margin: 0;
  color: #909399;
}

.form-card {
  max-width: 900px;
  margin: 0 auto 24px;
}

.form-card .el-form {
  padding-top: 8px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  column-gap: 24px;
}

.contact-page > .el-card:last-child {
  max-width: 900px;
  margin: 0 auto;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
