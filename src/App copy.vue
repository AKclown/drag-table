<template>
  <VueDraggable
    target=".ant-table-tbody"
    v-model="data"
    :animation="150"
    draggable=".ant-table-row"
    filter=".forbid"
    @end="end"
    @start="start"
  >
    <a-table
      :columns="columns"
      :dataSource="data"
      childrenColumnName="children"
      :rowClassName="rowClassName"
    >
    </a-table>
  </VueDraggable>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { VueDraggable } from "vue-draggable-plus";

const columns = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Age",
    dataIndex: "age",
    key: "age",
    width: "12%",
  },
  {
    title: "Address",
    dataIndex: "address",
    width: "30%",
    key: "address",
  },
];

const data = ref([
  {
    key: 1,
    name: "John Brown sr.",
    age: 60,
    address: "New York No. 1 Lake Park",
    children: [
      {
        key: 11,
        name: "John Brown",
        age: 42,
        address: "New York No. 2 Lake Park",
      },
      {
        key: 12,
        name: "John Brown jr.",
        age: 30,
        address: "New York No. 3 Lake Park",
        children: [
          {
            key: 121,
            name: "Jimmy Brown",
            age: 16,
            address: "New York No. 3 Lake Park",
          },
        ],
      },
      {
        key: 13,
        name: "Jim Green sr.",
        age: 72,
        address: "London No. 1 Lake Park",
        children: [
          {
            key: 131,
            name: "Jim Green",
            age: 42,
            address: "London No. 2 Lake Park",
            children: [
              {
                key: 1311,
                name: "Jim Green jr.",
                age: 25,
                address: "London No. 3 Lake Park",
              },
              {
                key: 1312,
                name: "Jimmy Green sr.",
                age: 18,
                address: "London No. 4 Lake Park",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: 2,
    name: "Joe Black",
    age: 32,
    address: "Sidney No. 1 Lake Park",
  },
]);

const forbid = ref([]);

const rowClassName = (record) => {
  console.log('record: ', record);
  if (forbid.value.includes(record.key)) {
    return "forbid";
  }
  return "";
};

const getChildrenIds = (data) => {
  let ids = [];
  data.forEach((item) => {
    ids.push(item.key);
    if (item.children) {
      ids = ids.concat(getChildrenIds(item.children));
    }
  });
  return ids;
};

const start = (record) => {
  const ids = getChildrenIds(record.data.children);
  forbid.value = ids;
};

const end = () => {};
</script>
