'use client'

import { useState } from 'react'

interface TextInputProps {
  content: string
  onContentChange: (content: string) => void
}

export default function TextInput({ content, onContentChange }: TextInputProps) {
  const [text, setText] = useState(content)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onContentChange(newText)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Enter Your Text
      </h2>
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type or paste your content here..."
        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <span>{text.length} characters</span>
        <span>{text.split(/\s+/).filter(word => word.length > 0).length} words</span>
      </div>
    </div>
  )
}