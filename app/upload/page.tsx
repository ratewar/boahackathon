"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, LinkIcon, FileText, ImageIcon, Loader2, Trash2, Eye, Search } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { uploadFile, uploadLink, getDocuments, deleteDocument } from "@/app/actions/upload"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import type { Document } from "@/lib/types"

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [url, setUrl] = useState("")
  const [bulkUrls, setBulkUrls] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    const result = await getDocuments()
    if (result.success) {
      setDocuments(result.documents)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleFileUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadFile(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: `${file.name} uploaded and processed successfully`,
        })
      } else {
        toast({
          title: "Upload Failed",
          description: result.error || "Failed to upload file",
          variant: "destructive",
        })
      }
    }

    setIsUploading(false)
    setFiles([])
    await loadDocuments()
  }

  const handleUrlUpload = async () => {
    if (!url) return

    setIsUploading(true)
    const result = await uploadLink(url)

    if (result.success) {
      toast({
        title: "Success",
        description: "Link processed successfully",
      })
      setUrl("")
    } else {
      toast({
        title: "Link Processing Failed",
        description: result.error || "Failed to process link",
        variant: "destructive",
      })
    }

    setIsUploading(false)
    await loadDocuments()
  }

  const handleBulkUpload = async () => {
    const urls = bulkUrls.split("\n").filter((u) => u.trim())
    if (urls.length === 0) return

    setIsUploading(true)
    let successCount = 0
    let failCount = 0

    for (const url of urls) {
      const result = await uploadLink(url.trim())
      if (result.success) {
        successCount++
      } else {
        failCount++
        toast({
          title: "Error",
          description: `Failed to process ${url}: ${result.error}`,
          variant: "destructive",
        })
      }
    }

    if (successCount > 0) {
      toast({
        title: "Bulk Upload Complete",
        description: `Successfully processed ${successCount} link${successCount !== 1 ? "s" : ""}${failCount > 0 ? `, ${failCount} failed` : ""}`,
      })
    }

    setIsUploading(false)
    setBulkUrls("")
    await loadDocuments()
  }

  const handleDelete = async (id: string) => {
    const result = await deleteDocument(id)
    if (result.success) {
      toast({
        title: "Success",
        description: "Document deleted",
      })
      await loadDocuments()
    } else {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      })
    }
  }

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const getDocumentIcon = (type: string) => {
    if (type === "link") return <LinkIcon className="h-5 w-5 text-muted-foreground" />
    return <FileText className="h-5 w-5 text-muted-foreground" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary">Processed</Badge>
      case "processing":
        return <Badge variant="outline">Processing</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-"
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">Upload files or add links to build your knowledge base</p>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="documents">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Support for PDF, images, and documents. Files will be processed and embedded automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`relative flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                  dragActive ? "border-primary bg-accent" : "border-border bg-background hover:border-primary/50"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-2 text-sm font-medium text-foreground">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports PDF, PNG, JPG, DOCX, TXT and more</p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Files ({files.length})</Label>
                  <div className="space-y-2 rounded-lg border border-border p-4">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md bg-accent p-2">
                        <div className="flex items-center gap-2">
                          {file.type.startsWith("image/") ? (
                            <ImageIcon className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setFiles(files.filter((_, i) => i !== index))}>
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleFileUpload} disabled={isUploading} className="w-full">
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload and Process
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Links</CardTitle>
              <CardDescription>
                Add URLs to web pages, articles, or documentation. Content will be extracted and embedded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/article"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleUrlUpload} disabled={!url || isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Add Link and Process
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bulk Import</CardTitle>
              <CardDescription>Add multiple URLs at once, one per line</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                className="min-h-[150px]"
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
              />
              <Button onClick={handleBulkUpload} disabled={!bulkUrls || isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Import All Links
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? "s" : ""} in your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No documents found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getDocumentIcon(doc.type)}
                              <span className="font-medium">{doc.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{doc.type}</TableCell>
                          <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                          <TableCell>{formatDate(doc.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(doc.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {doc.file_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                {doc.link_url && (
                                  <DropdownMenuItem asChild>
                                    <a href={doc.link_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Open Link
                                    </a>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(doc.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
          <CardDescription>How your documents are processed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <h3 className="font-semibold">Upload</h3>
              <p className="text-sm text-muted-foreground">Files are securely uploaded to cloud storage</p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h3 className="font-semibold">Extract & Embed</h3>
              <p className="text-sm text-muted-foreground">
                Content is extracted and converted to AI embeddings using OpenAI
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <h3 className="font-semibold">Ready to Query</h3>
              <p className="text-sm text-muted-foreground">Documents are searchable via the chat interface with RAG</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
